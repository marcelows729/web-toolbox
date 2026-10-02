import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readFileSync} from 'node:fs'
import {convertWidth,defaultWidthTargets,MAX_WIDTH_UNITS} from '../src/tools/width-converter/width.ts'
import {tools} from '../src/tools/registry.ts'
import {emptyShelf,updateShelf,parseShelf} from '../src/state/toolShelf.ts'
const all={letters:true,digits:true,symbols:true,spaces:true}
test('幅変換: 既定英字数字のみ・大小保持・変更数・元入力保持',()=>{
 const input='ＡｂＣ１２３！　かな😀';assert.deepEqual(convertWidth(input,'half',defaultWidthTargets()),{output:'AbC123！　かな😀',changed:6});assert.equal(input,'ＡｂＣ１２３！　かな😀')
 assert.deepEqual(convertWidth('AbC123! かな😀','full',defaultWidthTargets()),{output:'ＡｂＣ１２３! かな😀',changed:6})
})
test('幅変換: ASCII全対応表・往復と各対象OFF',()=>{
 const ascii=Array.from({length:94},(_,i)=>String.fromCharCode(0x21+i)).join(''),full=Array.from({length:94},(_,i)=>String.fromCharCode(0xff01+i)).join('')
 assert.deepEqual(convertWidth(ascii,'full',all),{output:full,changed:94});assert.deepEqual(convertWidth(full,'half',all),{output:ascii,changed:94})
 for(const id of ['letters','digits','symbols','spaces']){const selected={letters:false,digits:false,symbols:false,spaces:false,[id]:true};const r=convertWidth('Az9! ','full',selected);assert.equal(r.changed,id==='letters'?2:1)}
 assert.deepEqual(convertWidth('Ａ1!　','half',{letters:false,digits:false,symbols:false,spaces:false}),{output:'Ａ1!　',changed:0})
})
test('幅変換: 日本語・カナ濁点・互換文字・emoji・タブ改行を保持',()=>{
 const input='ひらがな カタカナ ｶﾞ が 漢字 😀👩‍👩‍👧‍👦 ①⑳ Ⅳ ㎏ ℃ ㍻ \t\r\n\r\n'
 const noSpaces={...all,spaces:false};assert.deepEqual(convertWidth(input,'full',noSpaces),{output:input,changed:0})
 assert.equal(convertWidth('e\u0301 カ\u3099','full',noSpaces).output,'ｅ\u0301 カ\u3099')
 assert.equal(convertWidth('1️⃣#️⃣*️⃣1⃣1︎⃣','full',all).output,'1️⃣#️⃣*️⃣1⃣1︎⃣')
})
test('幅変換: チルダ/波ダッシュ・逆斜線/円記号を混同しない',()=>{
 assert.deepEqual(convertWidth('～〜￥¥＼','half',all),{output:'~〜￥¥\\',changed:2})
 assert.deepEqual(convertWidth('~〜￥¥\\','full',all),{output:'～〜￥¥＼',changed:2})
 assert.equal(convertWidth('「」。、\u00a0\t\n','full',all).output,'「」。、\u00a0\t\n')
})
test('幅変換: スペースは2文字の対応だけ・空入力と変更0の結果',()=>{
 assert.deepEqual(convertWidth(' 　 \t\n','full',all),{output:'\u3000\u3000\u3000\t\n',changed:2})
 assert.deepEqual(convertWidth(' 　 \t\n','half',all),{output:'   \t\n',changed:1})
 assert.deepEqual(convertWidth('','half',all),{output:'',changed:0})
 assert.deepEqual(convertWidth('かな😀','half',all),{output:'かな😀',changed:0})
})
test('幅変換: 入出力50,000UTF-16単位・増幅なし・不正設定',()=>{
 const r=convertWidth('a'.repeat(MAX_WIDTH_UNITS),'full',all);assert.equal(r.output.length,MAX_WIDTH_UNITS);assert.equal(r.changed,MAX_WIDTH_UNITS)
 assert.equal(convertWidth('😀'.repeat(25000),'full',all).output.length,MAX_WIDTH_UNITS)
 assert.throws(()=>convertWidth('a'.repeat(MAX_WIDTH_UNITS+1),'full',all),/50,000/)
 assert.throws(()=>convertWidth('a','unknown',all),/変換方向/);assert.throws(()=>convertWidth('a','half',{...all,letters:undefined}),/対象/)
})
test('幅変換: 登録・lazyルート・既存棚のIDと入力非保存',()=>{
 const tool=tools.find(t=>t.id==='width-converter');assert.equal(tool.category,'text');assert.equal(tool.path,'/tools/width-converter')
 const app=readFileSync('src/App.tsx','utf8');assert.ok(app.includes('const WidthConverter = lazy'));assert.ok(app.includes('path="/tools/width-converter" element={<WidthConverter />}'))
 const shelf=updateShelf(updateShelf(emptyShelf(),{type:'favorite',id:'text-formatter'}),{type:'visit',id:tool.id});assert.deepEqual(parseShelf(JSON.stringify(shelf)),shelf)
 const source=readFileSync('src/tools/width-converter/width.ts','utf8')+readFileSync('src/tools/width-converter/WidthConverter.tsx','utf8');assert.ok(!/\.normalize\(|localStorage|sessionStorage|fetch\(|dangerouslySetInnerHTML|URLSearchParams/.test(source))
})
