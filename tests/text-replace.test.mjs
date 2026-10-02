import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { replaceLiteral,REPLACE_LIMITS,normalizeReplaceLines,validateReplaceField } from '../src/tools/text-replace/replace.ts'
import { tools } from '../src/tools/registry.ts'
import { filterToolList } from '../src/utils/toolSearch.ts'
import { emptyShelf,updateShelf,parseShelf } from '../src/state/toolShelf.ts'
test('一括置換: カンマ・記号はリテラル、生成文字列を再検索しない',()=>{
 assert.deepEqual(replaceLiteral('a,b,c',',',"','"),{output:"a','b','c",count:2})
 assert.deepEqual(replaceLiteral('a','a','aa'),{output:'aa',count:1})
 assert.deepEqual(replaceLiteral('.* $& .*','.*','$&'),{output:'$& $& $&',count:2})
})
test('一括置換: 空検索拒否・削除・空本文・一致なし・左から非重複',()=>{
 assert.throws(()=>replaceLiteral('a','','b'),/検索文字列/)
 assert.deepEqual(replaceLiteral('aaaa','aa',''),{output:'',count:2})
 assert.deepEqual(replaceLiteral('ababa','aba','X'),{output:'Xba',count:1})
 assert.deepEqual(replaceLiteral('aaa','aa','X'),{output:'Xa',count:1})
 assert.deepEqual(replaceLiteral('','a','b'),{output:'',count:0})
 assert.deepEqual(replaceLiteral('abc','z','X'),{output:'abc',count:0})
})
test('一括置換: 日本語・全角・emoji・結合文字・大小文字を区別',()=>{
 assert.deepEqual(replaceLiteral('猫 猫 Ａ A a','猫','犬'),{output:'犬 犬 Ａ A a',count:2})
 assert.deepEqual(replaceLiteral('ＡAa','A','x'),{output:'Ａxa',count:1})
 assert.deepEqual(replaceLiteral('👩‍👩‍👧‍👦 😀 😀','😀','🇯🇵'),{output:'👩‍👩‍👧‍👦 🇯🇵 🇯🇵',count:2})
 assert.deepEqual(replaceLiteral('é e\u0301','é','X'),{output:'X e\u0301',count:1})
 assert.equal(replaceLiteral('<img src=x onerror=bad()>','x','<script>bad</script>').output,'<img src=<script>bad</script> onerror=bad()>')
})
test('一括置換: 本文・検索・置換のCRLFとCRをLFに統一し複数行一致',()=>{
 assert.equal(normalizeReplaceLines('a\r\nb\rc\n'),'a\nb\nc\n')
 assert.deepEqual(replaceLiteral('a\r\nb\ra\nb','a\r\nb','X\r\nY'),{output:'X\nY\nX\nY',count:2})
 assert.deepEqual(replaceLiteral('a\r\nb\n','\n',''),{output:'ab',count:2})
})
test('一括置換: 各入力上限と結果増幅を生成前に制限',()=>{
 for(const field of ['input','search','replacement']){
  assert.doesNotThrow(()=>validateReplaceField(field,'a'.repeat(REPLACE_LIMITS[field])))
  assert.throws(()=>validateReplaceField(field,'a'.repeat(REPLACE_LIMITS[field]+1)),/まで/)
 }
 assert.equal(replaceLiteral('a'.repeat(50_000),'a','aa').output.length,100_000)
 assert.throws(()=>replaceLiteral('a'.repeat(50_000),'a','aaa'),/結果が100,000/)
 assert.throws(()=>replaceLiteral('a'.repeat(50_000),'a','x'.repeat(10_000)),/結果が100,000/)
 assert.throws(()=>replaceLiteral('a'.repeat(50_001),'z',''),/元の本文/)
 assert.throws(()=>replaceLiteral('a','x'.repeat(1_001),''),/検索文字列/)
 assert.throws(()=>replaceLiteral('a','a','x'.repeat(10_001)),/置換文字列/)
})
test('一括置換: 一覧・検索・遅延ルート・棚のID互換と入力を保存しない',()=>{
 const tool=tools.find(t=>t.id==='text-replace');assert.equal(tool.path,'/tools/text-replace');assert.equal(tool.category,'text')
 assert.ok(filterToolList(tools,'文字を置き換える','text').some(t=>t.id===tool.id))
 assert.ok(readFileSync('src/App.tsx','utf8').includes('const TextReplace = lazy'))
 assert.ok(readFileSync('src/App.tsx','utf8').includes('path="/tools/text-replace" element={<TextReplace />}'))
 const shelf=updateShelf(updateShelf(emptyShelf(),{type:'favorite',id:'text-formatter'}),{type:'visit',id:tool.id})
 assert.deepEqual(parseShelf(JSON.stringify(shelf)),shelf);assert.deepEqual(shelf.favorites,['text-formatter']);assert.equal(shelf.recent[0],tool.id)
 const source=readFileSync('src/tools/text-replace/TextReplace.tsx','utf8');assert.ok(!/localStorage|sessionStorage|fetch\(|URLSearchParams|dangerouslySetInnerHTML/.test(source))
})
