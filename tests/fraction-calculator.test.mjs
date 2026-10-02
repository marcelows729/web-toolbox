import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import { calculateFractions, FRACTION_LIMITS, fractionSummary, validateFractionInput } from '../src/tools/fraction-calculator/fraction.ts'
import { tools } from '../src/tools/registry.ts'
import { filterToolList } from '../src/utils/toolSearch.ts'
import { parseShelf } from '../src/state/toolShelf.ts'
const values=(a,b,c,d)=>({firstNumerator:String(a),firstDenominator:String(b),secondNumerator:String(c),secondDenominator:String(d)})
const calc=(a,b,c,d,operation='add')=>calculateFractions(values(a,b,c,d),operation)
test('分数: 四則演算の既知値・約分・整数・0',()=>{
  assert.equal(calc(1,2,1,3).exact,'5/6')
  assert.equal(calc(1,2,1,3,'subtract').exact,'1/6')
  assert.equal(calc(2,3,3,4,'multiply').exact,'1/2')
  assert.equal(calc(2,3,4,5,'divide').exact,'5/6')
  assert.equal(calc(2,4,3,6).exact,'1');assert.equal(calc(2,4,3,6,'subtract').exact,'0')
  assert.equal(calc(0,-2,3,7,'multiply').exact,'0');assert.equal(calc(0,2,3,7,'divide').exact,'0')
  assert.deepEqual(calc(1,2,1,2).value,{numerator:1n,denominator:1n})
})
test('分数: 負の分子・分母・0の符号を正規化',()=>{
  assert.equal(calc(1,-2,1,3).exact,'-1/6');assert.equal(calc(-1,-2,1,3).exact,'5/6')
  assert.equal(calc(-2,3,-4,5,'divide').exact,'5/6');assert.equal(calc(2,3,-4,5,'divide').exact,'-5/6')
  assert.equal(calc('-0','-12','-0','-7').exact,'0')
  assert.equal(fractionSummary(calc(1,-2,1,3)), '(-1/2) + 1/3 = -1/6')
})
test('分数: 帯分数は正確で、負号は全体にかかる',()=>{
  assert.equal(calc(7,6,0,1).mixed,'1 + 1/6');assert.equal(calc(-7,6,0,1).mixed,'−(1 + 1/6)')
  assert.equal(calc(13,6,0,1).mixed,'2 + 1/6')
  for(const value of [calc(1,6,0,1),calc(0,6,0,1),calc(12,6,0,1)])assert.equal(value.mixed,null)
  assert.equal(fractionSummary(calc(-7,6,0,1)),'(-7/6) + 0 = -7/6\n帯分数：−(1 + 1/6)')
})
test('分数: 全角・空白・符号・先頭0を受理、浮動小数へ変換しない',()=>{
  assert.equal(calc(' ＋００１ ','２','−１','－３').exact,'5/6')
  assert.equal(calc('9007199254740993','1','1','1').exact,'9007199254740994')
  const max='9'.repeat(18), near='9'.repeat(17)+'8'
  assert.equal(calc(max,1,max,1,'multiply').exact,(BigInt(max)**2n).toString())
  const result=calc(max,near,near,max)
  assert.equal(result.value.numerator,BigInt(max)**2n+BigInt(near)**2n)
  assert.equal(result.value.denominator,BigInt(max)*BigInt(near))
  assert.equal(result.value.numerator.toString().length,37);assert.equal(result.value.denominator.toString().length,36)
})
test('分数: 分母0・0除算を全符号と約分後も拒否',()=>{
  for(const zero of ['0','-0','＋０','０００']){
    assert.throws(()=>calc(1,zero,1,2),/分母/);assert.throws(()=>calc(1,2,1,zero),/分母/)
    assert.throws(()=>calc(1,2,zero,-7,'divide'),/分数2の分子/)
  }
})
test('分数: 全欄の空欄・不正形式・19桁・33文字・未知操作を拒否',()=>{
  for(const raw of ['','　','1.5','1/2','1,000','1e3','NaN','Infinity','--1','+','１ ２','<b>1</b>','1'.repeat(19),'0'.repeat(19)])for(const field of Object.keys(values(1,2,1,3)))assert.throws(()=>calculateFractions({...values(1,2,1,3),[field]:raw},'add'))
  assert.doesNotThrow(()=>validateFractionInput(' '.repeat(31)+'1'));assert.throws(()=>validateFractionInput(' '.repeat(32)+'1'),/32文字/)
  for(const field of Object.keys(values(1,2,1,3)))assert.throws(()=>calculateFractions({...values(1,2,1,3),[field]:' '.repeat(32)+'1'},'add'))
  assert.throws(()=>calculateFractions(values(1,2,1,3),'unknown'));assert.deepEqual(FRACTION_LIMITS,{digits:18,input:32})
})
test('分数: 正負の四則結果を独立した交差積で検証し既約・分母正を維持',()=>{
  const gcd=(x,y)=>{x=x<0n?-x:x;while(y){[x,y]=[y,x%y]}return x}
  for(let a=-6n;a<=6n;a++)for(let b=1n;b<=5n;b++)for(let c=-4n;c<=4n;c++)for(let d=1n;d<=4n;d++)for(const operation of ['add','subtract','multiply','divide']){
    if(operation==='divide'&&c===0n)continue
    const {value:r}=calc(a,b,c,d,operation)
    const n=operation==='add'?a*d+c*b:operation==='subtract'?a*d-c*b:operation==='multiply'?a*c:a*d
    const den=operation==='divide'?b*c:b*d
    assert.equal(r.numerator*den,n*r.denominator);assert.ok(r.denominator>0n);assert.equal(gcd(r.numerator,r.denominator),1n)
  }
})
test('分数: 登録・検索・棚・lazyルート・ラベル・初期コピー無効・保存送信なし',async()=>{
  const id='fraction-calculator',entry=tools.find(tool=>tool.id===id);assert.equal(entry.path,'/tools/'+id);assert.equal(entry.category,'general')
  for(const query of ['分数','約分','帯分数','fraction','ぶんすう','算数'])assert.ok(filterToolList(tools,query,'all').some(tool=>tool.id===id))
  assert.deepEqual(parseShelf(JSON.stringify({version:1,favorites:[id],recent:[id]})).favorites,[id])
  const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');assert.ok(app.includes("lazy(() => import('./tools/fraction-calculator/FractionCalculator'))"));assert.ok(app.includes('<Route path="/tools/fraction-calculator" element={<FractionCalculator />} />'))
  for(const file of ['FractionCalculator.tsx','fraction.ts'])assert.doesNotMatch(readFileSync(new URL('../src/tools/fraction-calculator/'+file,import.meta.url),'utf8'),/localStorage|sessionStorage|fetch\s*\(|sendBeacon|URLSearchParams|dangerouslySetInnerHTML/)
  const {default:Component}=await import('../src/tools/fraction-calculator/FractionCalculator.tsx');const markup=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(Component)))
  assert.equal((markup.match(/<legend>分数[12]<\/legend>/g)||[]).length,2)
  for(const field of ['firstNumerator','firstDenominator','secondNumerator','secondDenominator'])assert.ok(markup.includes('for="fraction-'+field+'"'))
  assert.match(markup,/id="calculation-copy"[^>]*disabled/);assert.ok(markup.includes('保存・送信・URL'))
})
