import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { calculateAspect,aspectSummary,ASPECT_PRESETS } from '../src/tools/aspect-ratio/aspect.ts'
import { tools } from '../src/tools/registry.ts'
import { emptyShelf,updateShelf,parseShelf } from '../src/state/toolShelf.ts'
const calc=(w='1920',h='1080',axis='width',target='1280',rounding='round')=>calculateAspect(w,h,axis,target,rounding)
test('縦横比: 1920×1080=16:9、幅1280→高さ720、逆方向と縦横反転',()=>{
 const r=calc();assert.equal(r.original.ratio,'16:9');assert.equal(r.size.width,'1280');assert.equal(r.size.height,'720');assert.equal(r.size.changed,false);assert.equal(r.size.ratioAfter,'16:9')
 assert.equal(calc('1920','1080','height','720').size.width,'1280')
 const portrait=calc('1080','1920','width','720');assert.equal(portrait.original.ratio,'9:16');assert.equal(portrait.size.height,'1280')
 assert.match(aspectSummary(r),/1280 × 720/)
})
test('縦横比: プリセット・1:1・互いに素・有限小数を正確に約分',()=>{
 for(const [w,h] of ASPECT_PRESETS)assert.equal(calc(w,h,'width','').original.ratio,`${w}:${h}`)
 assert.equal(calc('100','100','width','42').size.height,'42')
 assert.equal(calc('17','13','width','').original.ratio,'17:13')
 assert.equal(calc('0.1','0.3','width','').original.ratio,'1:3')
 assert.equal(calc('1.2','0.8','width','1.5').original.ratio,'3:2')
 assert.equal(calc('1.2','0.8','width','1.5').size.height,'1')
 assert.equal(calc('１２．５','７．５','width','１０').original.ratio,'5:3')
 assert.equal(calc('１２．５','７．５','width','１０').size.height,'6')
})
test('縦横比: 四捨五入の0.5・切上・切捨・循環小数と比率差',()=>{
 assert.equal(calc('2','1','width','3','round').size.height,'2')
 assert.equal(calc('2','1','width','3','ceil').size.height,'2')
 assert.equal(calc('2','1','width','3','floor').size.height,'1')
 const r=calc('3','2','width','4','floor');assert.equal(r.size.changed,true);assert.equal(r.size.ratioAfter,'2:1');assert.match(aspectSummary(r),/元の比率と差/)
 const d=calc('3','2','width','1','decimal');assert.equal(d.size.height,'約0.666667');assert.equal(d.size.ratioAfter,null)
 assert.equal(calc('1000000','0.000001','width','0.000001','decimal').size.height,'0.000001未満')
 assert.throws(()=>calc('3','2','width','0.1','round'),/丸め後の寸法が0/)
 assert.equal(calc('3','2','width','0.1','ceil').size.height,'1')
})
test('縦横比: 各寸法の不正・ゼロ・巨大値と計算側の上限',()=>{
 for(const value of ['0','-1','Infinity','NaN','1e6','1/2','1,000','1.0000001','1000000.000001','1'.repeat(33),'abc'])for(const field of ['width','height','target']){
  assert.throws(()=>calc(field==='width'?value:'1920',field==='height'?value:'1080','width',field==='target'?value:'1280'))
 }
 assert.throws(()=>calc('','1080'),/元の幅/);assert.throws(()=>calc('1920',''),/元の高さ/)
 assert.equal(calc('1000000','1000000','width','1000000').size.height,'1000000')
 assert.equal(calc('1000000','0.000001','width','').original.ratio,'1000000000000:1')
 assert.throws(()=>calc('0.000001','1000000','width','1'),/計算する側の寸法が1,000,000/)
 assert.throws(()=>calc('1','1','both'),/指定する寸法/);assert.throws(()=>calc('1','1','width','1','invalid'),/丸め方/)
})
test('縦横比: 比率だけの計算と元入力の非変更・フォーム相互更新なし',()=>{
 const values={width:'1920',height:'1080',axis:'width',target:'',rounding:'round'},before={...values}
 assert.equal(calculateAspect(...Object.values(values)).size,null);assert.deepEqual(values,before)
 const source=readFileSync('src/tools/aspect-ratio/AspectRatio.tsx','utf8');assert.ok(!/useEffect|localStorage|sessionStorage|fetch\(|URLSearchParams/.test(source))
})
test('縦横比: 遅延ルート・カテゴリ・旧棚IDを保持',()=>{
 const t=tools.find(t=>t.id==='aspect-ratio');assert.equal(t.path,'/tools/aspect-ratio');assert.equal(t.category,'general')
 const app=readFileSync('src/App.tsx','utf8');assert.ok(app.includes('const AspectRatio = lazy'));assert.ok(app.includes('path="/tools/aspect-ratio" element={<AspectRatio />}'))
 const shelf=updateShelf(updateShelf(emptyShelf(),{type:'favorite',id:'image-resizer'}),{type:'visit',id:t.id});assert.deepEqual(parseShelf(JSON.stringify(shelf)),shelf);assert.deepEqual(shelf.favorites,['image-resizer'])
})
