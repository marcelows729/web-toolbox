import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { formatText, defaultTextOptions, TEXT_OPERATIONS, validateTextInput, MAX_TEXT_UNITS, MAX_TEXT_LINES, rawTextOffset, applyDisplayedEdit } from '../src/tools/text-formatter/format.ts'
import { getGraphemeLength, countLines, textCounts } from '../src/tools/character-counter/count.ts'
import TextFormatter from '../src/tools/text-formatter/TextFormatter.tsx'
import { tools } from '../src/tools/registry.ts'
import { filterToolList } from '../src/utils/toolSearch.ts'
import { emptyShelf, updateShelf, parseShelf } from '../src/state/toolShelf.ts'

const transform = (input,patch={}) => formatText(input,{...defaultTextOptions(),...patch})
test('テキスト整形: 全操作OFFで空入力・改行・Unicode・空白を完全に保持', () => {
  assert.ok(Object.values(defaultTextOptions()).every(value=>value===false))
  for(const input of ['', 'a\r\nb\nc\rd\r\n', '\n\n', '　\tＡ a　\t\n', 'e\u0301\né\n😀👩‍👩‍👧‍👦🇯🇵', '<script>bad</script>\n'])assert.equal(transform(input).output,input)
  assert.deepEqual(transform('').before,{characters:0,lines:0})
})
test('テキスト整形: 行の両端だけ空白除去し、全角・タブと中の空白を区別', () => {
  assert.equal(transform('　\t a　b \t\r\n　\t\r\nc  d　\n',{trimLines:true}).output,'a　b\r\n\r\nc  d\n')
  assert.equal(transform('\u00a0a\u00a0',{trimLines:true}).output,'a')
})
test('テキスト整形: 空行削除・連続空行集約と末尾改行の明示的な挙動', () => {
  assert.equal(transform('a\r\n　\r\n\t\nb\n',{removeBlankLines:true}).output,'a\r\nb')
  assert.equal(transform('a\r\n　\r\n\t\nb\n',{collapseBlankLines:true}).output,'a\r\n　\r\nb\n')
  assert.equal(transform('a\n',{removeBlankLines:true}).output,'a')
  assert.equal(transform('a\n\n\n',{collapseBlankLines:true}).output,'a\n')
  assert.equal(transform('\n\n',{collapseBlankLines:true}).output,'')
  assert.equal(transform('\t\n　\n',{collapseBlankLines:true}).output,'\t')
  assert.equal(transform('\n\t\n',{removeBlankLines:true}).output,'')
})
test('テキスト整形: 完全一致のみ、最初の行と元の区切りを保持', () => {
  assert.equal(transform('A\r\na\nA\ré\ne\u0301\né\n',{dedupeLines:true}).output,'A\r\na\né\ne\u0301\n')
  assert.equal(transform(' a\na\n a',{dedupeLines:true}).output,' a\na')
  assert.equal(transform(' a\na\n a',{trimLines:true,dedupeLines:true}).output,'a')
  assert.equal(transform('x\nx',{dedupeLines:true}).output,'x')
})
test('テキスト整形: 改行1つを空白1つに、CRLF・CR・末尾と既存空白を保持', () => {
  assert.equal(transform('a \r\n b\rc\n',{joinLines:true}).output,'a   b c ')
  assert.equal(transform('a\n\nb',{joinLines:true}).output,'a  b')
  assert.equal(transform('　a \n b　',{trimLines:true,joinLines:true}).output,'a b')
})
test('テキスト整形: 全32操作組合せと固定処理順、入力・設定を変更しない', () => {
  const input=' A \n\t\n\nA\na\nA\n'
  for(let flags=0;flags<32;flags++){
    const options=Object.fromEntries(TEXT_OPERATIONS.map((op,index)=>[op.id,!!(flags&(1<<index))]));const before={...options}
    let lines=input.split('\n')
    if(options.trimLines)lines=lines.map(line=>line.trim())
    if(options.removeBlankLines)lines=lines.filter(line=>line.trim()!=='')
    if(options.collapseBlankLines)lines=lines.filter((line,index)=>line.trim()!==''||index===0||lines[index-1].trim()!=='')
    if(options.dedupeLines)lines=lines.filter((line,index)=>lines.indexOf(line)===index)
    const expected=lines.join(options.joinLines?' ':'\n')
    assert.equal(formatText(input,options).output,expected,JSON.stringify(options));assert.deepEqual(options,before)
  }
})
test('共有カウント: 空文字・末尾改行・CRLF/LF/CRと見た目の文字数', () => {
  assert.deepEqual(textCounts(''),{characters:0,lines:0})
  assert.equal(countLines('a\r\nb\nc\r'),4)
  assert.deepEqual(textCounts('a\r\n'),{characters:2,lines:2})
  for(const text of ['😀','e\u0301','👩‍👩‍👧‍👦','🇯🇵'])assert.equal(getGraphemeLength(text),1)
  const result=transform('😀\n😀\ne\u0301',{dedupeLines:true});assert.deepEqual(result.before,{characters:5,lines:3});assert.deepEqual(result.after,{characters:3,lines:2})
  const source=readFileSync(new URL('../src/tools/character-counter/CharacterCounter.tsx',import.meta.url),'utf8');assert.ok(source.includes("import { countLines, getGraphemeLength } from './count'"))
})
test('共有カウント: Segmenterが使えない場合の既存コードポイントfallback', () => {
  const original=Object.getOwnPropertyDescriptor(Intl,'Segmenter')
  try {Object.defineProperty(Intl,'Segmenter',{value:undefined,configurable:true,writable:true});assert.equal(getGraphemeLength('e\u0301'),2);assert.equal(getGraphemeLength('😀'),1);assert.equal(getGraphemeLength('👩‍👩‍👧‍👦'),7)}finally{Object.defineProperty(Intl,'Segmenter',original)}
})
test('テキスト整形: UTF-16・行数の上限を切り捨てず拒否、上限値は受理', () => {
  assert.doesNotThrow(()=>validateTextInput('a'.repeat(MAX_TEXT_UNITS)))
  assert.throws(()=>transform('a'.repeat(MAX_TEXT_UNITS+1)),/50,000/)
  assert.doesNotThrow(()=>validateTextInput('😀'.repeat(MAX_TEXT_UNITS/2)))
  assert.throws(()=>validateTextInput('😀'.repeat(MAX_TEXT_UNITS/2+1)),/50,000/)
  assert.doesNotThrow(()=>validateTextInput('\r\n'.repeat(MAX_TEXT_LINES-1)))
  assert.throws(()=>validateTextInput('\n'.repeat(MAX_TEXT_LINES)),/5,000/)
  assert.throws(()=>formatText('x',{...defaultTextOptions(),trimLines:'yes'}),/操作/)
})
test('テキスト整形: 表示のLFオフセットで編集しても他のCRLF/CRを変更しない', () => {
  const raw='a\r\nb\rc\n';assert.deepEqual([0,1,2,3,4,5,6].map(index=>rawTextOffset(raw,index)),[0,1,3,4,5,6,7])
  assert.equal(applyDisplayedEdit(raw,'a\nb\nc\n'),raw)
  assert.equal(applyDisplayedEdit(raw,'a\ndb\nc\n'),'a\r\ndb\rc\n')
  assert.equal(applyDisplayedEdit(raw,'ab\nc\n'),'ab\rc\n')
  assert.equal(applyDisplayedEdit(raw,'a\nb\nc\nend'),'a\r\nb\rc\nend')
  assert.equal(applyDisplayedEdit('', '😀\ne\u0301'),'😀\ne\u0301')
})
test('テキスト整形: 登録・検索・関連・棚ID・全操作OFFとHTMLを文字列表示', () => {
  const tool=tools.find(tool=>tool.id==='text-formatter');assert.equal(tool.category,'text');assert.equal(tool.path,'/tools/text-formatter')
  for(const query of ['文章整理','空白を消す','行をまとめる'])assert.ok(filterToolList(tools,query,'text').some(item=>item.id===tool.id))
  for(const id of tool.relatedTools)assert.ok(tools.some(tool=>tool.id===id))
  const shelf=updateShelf(updateShelf(emptyShelf(),{type:'favorite',id:tool.id}),{type:'visit',id:tool.id});assert.deepEqual(parseShelf(JSON.stringify(shelf)),shelf)
  const markup=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(TextFormatter)));assert.ok(!markup.includes('checked=""'));assert.equal((markup.match(/type="checkbox"/g)||[]).length,5);assert.ok(markup.includes('保存・送信・URLへの埋め込みはしません'))
  const html='<script>bad</script><img src=x onerror=bad>';assert.equal(transform(html).output,html);const escaped=renderToStaticMarkup(createElement('textarea',{readOnly:true,value:transform(html).output}));assert.ok(!escaped.includes('<script>'));assert.ok(escaped.includes('&lt;script&gt;'))
  const source=readFileSync(new URL('../src/tools/text-formatter/TextFormatter.tsx',import.meta.url),'utf8');assert.ok(!/localStorage|sessionStorage|URLSearchParams|fetch\s*\(|sendBeacon|dangerouslySetInnerHTML/.test(source))
  assert.ok(readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8').includes('<Route path="/tools/text-formatter" element={<TextFormatter />} />'))
})
