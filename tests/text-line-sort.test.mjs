import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {MemoryRouter} from 'react-router-dom'
import {formatText,defaultTextOptions,MAX_TEXT_LINES,MAX_TEXT_UNITS} from '../src/tools/text-formatter/format.ts'
import TextFormatter from '../src/tools/text-formatter/TextFormatter.tsx'
import {tools} from '../src/tools/registry.ts'
import {filterToolList} from '../src/utils/toolSearch.ts'
const sort=(input,order='ascending',options={})=>formatText(input,{...defaultTextOptions(),...options},order).output

test('行の並べ替え: 初期OFFは入力を維持し、不明な順序を拒否',()=>{
 for(const input of ['', '1', 'b\r\na\r\n', '😀\ne\u0301\n'])assert.equal(sort(input,'none'),input)
 for(const order of ['up','ASC','',null,1])assert.throws(()=>sort('b\na',order),/並べ替え/)
})
test('行の並べ替え: 日本語と数字部分を昇順・降順にし元入力を保持',()=>{
 const input='項目10\n項目2\n項目1',options=defaultTextOptions(),original={...options}
 assert.equal(formatText(input,options,'ascending').output,'項目1\n項目2\n項目10')
 assert.equal(formatText(input,options,'descending').output,'項目10\n項目2\n項目1')
 assert.equal(sort('う\nあ\nい'),'あ\nい\nう');assert.deepEqual(options,original)
})
test('行の並べ替え: 各位置のLF/CRLF/CR・末尾改行・空行を保持',()=>{
 for(const ending of ['\n','\r\n','\r']){
  assert.equal(sort('b'+ending+'a'),'a'+ending+'b')
  assert.equal(sort('b'+ending+'a'+ending),'a'+ending+'b'+ending)
  assert.equal(sort('a'+ending+'b'+ending,'descending'),'b'+ending+'a'+ending)
 }
 assert.equal(sort('c\r\na\rb\n'),'a\r\nb\rc\n')
 assert.equal(sort('b\n\na\n'),'\na\nb\n');assert.equal(sort('b\n\na\n','descending'),'b\na\n\n')
 assert.equal(sort('\r\n\n\r'),'\r\n\n\r')
})
test('行の並べ替え: 同じ照合順の行は降順でも元順・重複/Unicode/HTMLを改変しない',()=>{
 const composed='é',decomposed='e\u0301'
 assert.equal(sort(composed+'\n'+decomposed+'\na','descending'),composed+'\n'+decomposed+'\na')
 assert.equal(sort(composed+'\n'+decomposed,'ascending',{dedupeLines:true}),composed+'\n'+decomposed)
 assert.equal(sort('b\na\nb'),'a\nb\nb')
 const source=['<script>bad()</script>','😀',' A ','Ａ','a'];const result=sort(source.join('\n')).split('\n')
 assert.deepEqual([...result].sort(),[...source].sort())
})
test('行の並べ替え: 前処理後に並べ替え、改行置換を最後に行う',()=>{
 const input=' 項目10 \r\n 項目2 \n\n 項目2 \r 項目1 \r\n'
 assert.equal(sort(input,'ascending',{trimLines:true,removeBlankLines:true,dedupeLines:true,joinLines:true}),'項目1 項目2 項目10')
 assert.equal(sort(input,'descending',{trimLines:true,removeBlankLines:true,dedupeLines:true,joinLines:true}),'項目10 項目2 項目1')
})
test('行の並べ替え: 既存50k/5k上限、上限直前を切り捨てず処理',()=>{
 const input=Array.from({length:MAX_TEXT_LINES},(_,index)=>String(MAX_TEXT_LINES-index)).join('\n'),output=sort(input).split('\n')
 assert.equal(output.length,MAX_TEXT_LINES);assert.equal(output[0],'1');assert.equal(output.at(-1),'5000')
 assert.equal(sort('x'.repeat(MAX_TEXT_UNITS)).length,MAX_TEXT_UNITS)
 assert.throws(()=>sort('x'.repeat(MAX_TEXT_UNITS+1)),/50,000/);assert.throws(()=>sort('\n'.repeat(MAX_TEXT_LINES)),/5,000/)
})
test('行の並べ替え: 検索登録・初期NONE・ラベル・旧5操作・保存送信なし',()=>{
 for(const query of ['並べ替え','昇順','降順','sort'])assert.ok(filterToolList(tools,query,'text').some(tool=>tool.id==='text-formatter'))
 const html=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(TextFormatter)))
 assert.ok(html.includes('for="text-format-sort"'));assert.match(html,/<option value="none" selected="">/);assert.equal((html.match(/type="checkbox"/g)||[]).length,5)
 assert.match(html,/id="text-format-copy"[^>]*disabled/)
 const source=readFileSync(new URL('../src/tools/text-formatter/TextFormatter.tsx',import.meta.url),'utf8')
 assert.doesNotMatch(source,/fetch\s*\(|localStorage|sessionStorage|sendBeacon|URLSearchParams|dangerouslySetInnerHTML/)
})
