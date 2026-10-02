import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { convertColor } from '../src/tools/color-converter/color.ts'
import { tools } from '../src/tools/registry.ts'
import { filterToolList } from '../src/utils/toolSearch.ts'
import { parseShelf } from '../src/state/toolShelf.ts'
const values = patch => ({ hex: '', r: '', g: '', b: '', h: '', s: '', l: '', ...patch })
const hex = text => convertColor('hex', values({ hex: text }))
const rgb = (r,g,b) => convertColor('rgb', values({ r: String(r), g: String(g), b: String(b) }))
const hsl = (h,s,l) => convertColor('hsl', values({ h: String(h), s: String(s), l: String(l) }))

test('カラー: 黒白・原色・補色・グレーの既知値と短縮HEX', () => {
  for (const [code,channels,hslText] of [['#000',[0,0,0],'hsl(0, 0%, 0%)'],['#fff',[255,255,255],'hsl(0, 0%, 100%)'],['#f00',[255,0,0],'hsl(0, 100%, 50%)'],['#0f0',[0,255,0],'hsl(120, 100%, 50%)'],['#00f',[0,0,255],'hsl(240, 100%, 50%)'],['#ff0',[255,255,0],'hsl(60, 100%, 50%)'],['#0ff',[0,255,255],'hsl(180, 100%, 50%)'],['#f0f',[255,0,255],'hsl(300, 100%, 50%)'],['#808080',[128,128,128],'hsl(0, 0%, 50.1961%)']]) {
    assert.deepEqual(hex(code), rgb(...channels)); assert.equal(hex(code).hsl,hslText)
  }
  assert.deepEqual(hex('#2563eb'),{hex:'#2563EB',rgb:'rgb(37, 99, 235)',hsl:'hsl(221.2121, 83.1933%, 53.3333%)'})
  assert.equal(hex('#aBc').hex,'#AABBCC')
})
test('カラー: HSL各区間・色相循環・無彩色・四捨五入', () => {
  for (const [hue,code] of [[0,'#FF0000'],[30,'#FF8000'],[60,'#FFFF00'],[90,'#80FF00'],[120,'#00FF00'],[150,'#00FF80'],[180,'#00FFFF'],[210,'#0080FF'],[240,'#0000FF'],[270,'#8000FF'],[300,'#FF00FF'],[330,'#FF0080'],[-120,'#0000FF'],[360,'#FF0000'],[720,'#FF0000'],[-360000,'#FF0000'],[360000,'#FF0000']]) assert.equal(hsl(hue,100,50).hex,code)
  assert.equal(hsl(360,0,50).hex,'#808080'); assert.equal(hsl(270,100,0).hsl,'hsl(0, 0%, 0%)'); assert.equal(hsl(270,100,100).hsl,'hsl(0, 0%, 100%)')
  assert.equal(hsl(0,0,49.999999).hex,'#7F7F7F'); assert.equal(hsl(0,0,50.000001).hex,'#808080')
  assert.equal(hsl(359.999999,100,50).hsl,'hsl(0, 100%, 50%)')
})
test('カラー: 4096色と全256階調で表示HSL/HEXのRGB往復を維持', () => {
  const check = channels => { const result=rgb(...channels);const parts=result.hsl.match(/[\d.]+/g);assert.deepEqual(hsl(...parts),result);assert.deepEqual(hex(result.hex),result) }
  for(let r=0;r<256;r+=17)for(let g=0;g<256;g+=17)for(let b=0;b<256;b+=17)check([r,g,b])
  for(let n=0;n<256;n++)check([n,n,n])
})
test('カラー: 全角ASCII・前後空白・小数と負色相を受理', () => {
  assert.deepEqual(hex('　＃ａＢＣ　'),hex('#abc'));assert.deepEqual(rgb(' ２５５ ','０','０'),hex('#f00'));assert.deepEqual(hsl('－１２０','１００.００００００','５０'),hex('#00f'));assert.equal(hsl('＋３６０','０','.５').hex,'#010101')
})
test('カラー: 空欄・不正HEX・注入・非有限値・範囲外・7桁小数を拒否', () => {
  for(const value of ['','　','#','fff','#12','#1234','#12345','#12345678','#ggg','#ff ff','red','rgb(1,2,3)','#fff; color:red','＃１２Ｇ',' '.repeat(33)+'#fff'])assert.throws(()=>hex(value))
  for(const value of ['','　','-1','256','1.5','NaN','Infinity','1e2','0xff','1,000','+1','１ ２','1'.repeat(33)])for(const field of ['r','g','b'])assert.throws(()=>convertColor('rgb',values({r:'0',g:'0',b:'0',[field]:value})))
  for(const field of ['h','s','l'])for(const value of ['','　','NaN','Infinity','1e1','10%','1,5','0.1234567','1.','--1','1'.repeat(33)])assert.throws(()=>convertColor('hsl',values({h:'0',s:'50',l:'50',[field]:value})))
  for(const [field,value]of[['h','360001'],['h','-360001'],['s','-0.1'],['s','100.000001'],['l','-1'],['l','101']])assert.throws(()=>convertColor('hsl',values({h:'0',s:'50',l:'50',[field]:value})))
})
test('カラー: 登録・検索・棚・lazyルート・保存送信なし・初期コピー無効', async () => {
  const id='color-converter',entry=tools.find(tool=>tool.id===id);assert.equal(entry.path,'/tools/'+id);assert.equal(entry.category,'general')
  for(const query of ['カラーコード','色変換','ＨＥＸ','rgb','HSL','カラー'])assert.ok(filterToolList(tools,query,'all').some(tool=>tool.id===id))
  assert.deepEqual(parseShelf(JSON.stringify({version:1,favorites:[id],recent:[id]})).favorites,[id])
  const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');assert.ok(app.includes("lazy(() => import('./tools/color-converter/ColorConverter'))"));assert.ok(app.includes('<Route path="/tools/color-converter" element={<ColorConverter />} />'))
  for(const file of ['ColorConverter.tsx','color.ts'])assert.doesNotMatch(readFileSync(new URL('../src/tools/color-converter/'+file,import.meta.url),'utf8'),/localStorage|sessionStorage|fetch\s*\(|sendBeacon|URLSearchParams|EyeDropper|dangerouslySetInnerHTML/)
  const {default:Component}=await import('../src/tools/color-converter/ColorConverter.tsx');const markup=renderToStaticMarkup(createElement(Component));assert.equal((markup.match(/ disabled=""/g)||[]).length,3);assert.ok(markup.includes('保存・送信・URL'));assert.ok(markup.includes('role="status"'))
})
