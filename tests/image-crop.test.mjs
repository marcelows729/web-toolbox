import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { tools } from '../src/tools/registry.ts'
import { centeredCrop, cropDraft, cropRectangle, dragCrop, keyboardCrop } from '../src/tools/image-crop/crop.ts'
test('画像切り抜き: 全小寸法と全位置で自由矩形を検査、端と1画素を保持', () => {
  let count = 0
  for (let sw = 1; sw <= 8; sw++) for (let sh = 1; sh <= 8; sh++) for (let x = 0; x < sw; x++) for (let y = 0; y < sh; y++) for (let width = 1; width <= sw - x; width++) for (let height = 1; height <= sh - y; height++) {
    const rect = {x,y,width,height}
    assert.deepEqual(cropRectangle({width:sw,height:sh},cropDraft(rect),'free'),rect);count++
  }
  assert.equal(count,14400)
  assert.deepEqual(cropRectangle({width:8192,height:1},{x:'8191',y:'0',width:'1',height:'1'},'free'),{x:8191,y:0,width:1,height:1})
  assert.deepEqual(cropRectangle({width:1,height:8192},{x:'0',y:'8191',width:'1',height:'1'},'free'),{x:0,y:8191,width:1,height:1})
})
test('画像切り抜き: 固定比率は最大中央矩形と整数画素で正確、極小画像は自由指定', () => {
  for (const [ratio,a,b] of [['1:1',1,1],['4:3',4,3],['16:9',16,9]]) for (let width = 1; width <= 65; width++) for (let height = 1; height <= 45; height++) {
    if(width<a||height<b){assert.throws(()=>centeredCrop({width,height},ratio));continue}
    const r=centeredCrop({width,height},ratio),n=Math.floor(Math.min(width/a,height/b))
    assert.deepEqual(r,{x:Math.floor((width-n*a)/2),y:Math.floor((height-n*b)/2),width:n*a,height:n*b})
    assert.deepEqual(cropRectangle({width,height},cropDraft(r),ratio),r)
  }
  assert.deepEqual(centeredCrop({width:1,height:1},'free'),{x:0,y:0,width:1,height:1})
})
test('画像切り抜き: 無効数値・画像外・比率不一致を拒否、設定を変更しない', () => {
  const source=Object.freeze({width:64,height:48}),draft=Object.freeze({x:'0',y:'0',width:'16',height:'9'})
  assert.deepEqual(cropRectangle(source,draft,'16:9'),{x:0,y:0,width:16,height:9})
  for(const value of ['', '-1','1.5','1e1','NaN','Infinity','100000','  ']) assert.throws(()=>cropRectangle(source,{...draft,x:value},'free'))
  for(const changed of [{x:'64'},{y:'48'},{x:'63',width:'2'},{y:'47',height:'2'},{width:'0'},{height:'0'},{width:'17'}])assert.throws(()=>cropRectangle(source,{...draft,...changed},'16:9'))
  assert.throws(()=>cropRectangle(source,draft,'unknown'))
  assert.throws(()=>centeredCrop({width:4000,height:4000},'free'))
  assert.deepEqual(cropRectangle(source,{x:'０',y:'０',width:'１６',height:'９'},'16:9'),{x:0,y:0,width:16,height:9})
})
test('画像切り抜き: 逆方向ドラッグ、比率、矢印と端の制限', () => {
  const source={width:64,height:48},rect={x:10,y:10,width:16,height:9}
  assert.deepEqual(dragCrop(source,{x:40,y:30},{x:8,y:12},'16:9'),{x:8,y:12,width:32,height:18})
  assert.deepEqual(dragCrop(source,{x:40,y:30},{x:8,y:20},'16:9'),{x:24,y:21,width:16,height:9})
  assert.equal(dragCrop(source,{x:0,y:0},{x:15,y:8},'16:9'),null)
  assert.equal(dragCrop(source,{x:1,y:1},{x:1,y:2},'free'),null)
  assert.deepEqual(keyboardCrop(source,rect,'16:9','ArrowRight',false,true),{...rect,x:20})
  assert.deepEqual(keyboardCrop(source,rect,'16:9','ArrowDown',true,false),{...rect,width:32,height:18})
  for(const ratio of ['free','1:1','4:3','16:9'])for(const resize of [false,true])for(const large of [false,true])for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']){
    let r=centeredCrop(source,ratio)
    for(let i=0;i<30;i++){r=keyboardCrop(source,r,ratio,key,resize,large);assert.deepEqual(cropRectangle(source,cropDraft(r),ratio),r)}
  }
})
test('画像切り抜き: lazy・検索・関連登録、共有安全処理、ファイルを保存送信しない', () => {
  const t=tools.find(t=>t.id==='image-crop');assert.equal(t.name,'画像の切り抜き');assert.equal(t.category,'general');assert.ok(t.keywords.includes('トリミング'))
  const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');assert.ok(app.includes("lazy(() => import('./tools/image-crop/ImageCrop'))"));assert.ok(app.includes('<Route path="/tools/image-crop" element={<ImageCrop />} />'))
  const code=readFileSync(new URL('../src/tools/image-crop/ImageCrop.tsx',import.meta.url),'utf8');assert.ok(code.includes('useImageWork')&&code.includes('renderImages'));assert.ok(!/fetch\s*\(|localStorage|sessionStorage|sendBeacon|URLSearchParams|dangerouslySetInnerHTML/.test(code))
})
