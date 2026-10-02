import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import CalculationPage from '../src/tools/everyday-calculations/CalculationPage.tsx'
import { comparePrices, priceSummary, PRICE_UNITS } from '../src/tools/unit-price-comparison/price.ts'
import { scaleRecipe, recipeSummary } from '../src/tools/recipe-scaler/recipe.ts'
import { parseAmount, formatFraction } from '../src/tools/everyday-calculations/decimal.ts'
import { tools } from '../src/tools/registry.ts'
import { parseShelf, updateShelf, emptyShelf } from '../src/state/toolShelf.ts'
import { filterToolList } from '../src/utils/toolSearch.ts'
import UnitPriceComparison from '../src/tools/unit-price-comparison/UnitPriceComparison.tsx'
import RecipeScaler from '../src/tools/recipe-scaler/RecipeScaler.tsx'

const product = (price='100', amount='200', unit='g', name='') => ({name,price,amount,unit})
const ingredient = (amount='1', unit='個', name='卵') => ({name,amount,unit})
const people = (original='2', target='3') => ({mode:'people',original,target,factor:''})
const factor = value => ({mode:'factor',original:'ignored',target:'ignored',factor:value})

test('単価: g/kg・mL/Lの換算と基準量・個数', () => {
  for (const [small,large,label] of [['g','kg','100g'],['mL','L','100mL']]) {
    const result=comparePrices([product('298','500',small),product('500','1',large)],'standard')
    assert.equal(result.basis,label)
    assert.deepEqual(result.products.map(p=>[p.unitPrice,p.status]),[['59.6',''],['50','最安']])
    assert.equal(comparePrices([product('298','500',small),product('500','1',large)],'large').products[1].unitPrice,'500')
  }
  assert.equal(comparePrices([product('100','2','個'),product('200','5','個')],'standard').basis,'1個')
  assert.equal(comparePrices([product('100','2','個'),product('200','5','個')],'large').products[1].unitPrice,'400')
  for (const unit of PRICE_UNITS) assert.equal(comparePrices([product('1','1',unit),product('2','1',unit)],'standard').products[0].status,'最安')
})
test('単価: 正確な同値・全角小数・価格0・非最安の同値・4商品', () => {
  const result=comparePrices([product('０．１','０．３'),product('0.2','0.6'),product('0.3','0.9')],'standard')
  assert.deepEqual(result.products.map(p=>p.status),['最安（同値）','最安（同値）','最安（同値）'])
  assert.ok(priceSummary(result).includes('商品1'))
  const four=comparePrices([product('0','1'),product('0','2'),product('100','1'),product('200','2')],'standard')
  assert.deepEqual(four.products.map(p=>p.status),['最安（同値）','最安（同値）','同値','同値'])
  assert.equal(four.products[0].unitPrice,'0')
})
test('単価: 丸めと判定を分離し微小・巨大単価も失わない', () => {
  const result=comparePrices([product('1.005','100'),product('1.006','100')],'standard')
  assert.deepEqual(result.products.map(p=>p.unitPrice),['1.01','1.01'])
  assert.deepEqual(result.products.map(p=>p.status),['最安',''])
  assert.equal(comparePrices([product('0.000001','1000000000'),product('1','1')],'standard').products[0].unitPrice,'0.01未満')
  assert.equal(comparePrices([product('1000000000','0.000001'),product('1','1')],'standard').products[0].unitPrice,'100000000000000000')
})
test('単価: 次元混在・ゼロ量・不正単位・件数・不正数・上限を拒否', () => {
  for(const units of [['g','mL'],['kg','L'],['g','個'],['mL','個']]) assert.throws(()=>comparePrices(units.map(unit=>product('1','1',unit)),'standard'),/別々/)
  for(const unit of ['mg','ml','','constructor']) assert.throws(()=>comparePrices([product('1','1',unit),product()],'standard'))
  for(const inputs of [[],[product()],Array(5).fill(product())]) assert.throws(()=>comparePrices(inputs,'standard'))
  for(const text of ['', ' ', '-1', '−1', 'NaN','Infinity','1e3','１Ｅ３','1,000','1/2','1.','0.0000001','9'.repeat(33),'1000000000.000001']) {
    assert.throws(()=>comparePrices([product(text),product()],'standard'),text)
    assert.throws(()=>comparePrices([product('1',text),product()],'standard'),text)
  }
  assert.throws(()=>comparePrices([product('1','0'),product()],'standard'),/0より/)
  assert.throws(()=>comparePrices([product(),product()],'missing'))
  assert.throws(()=>comparePrices([product('1','1','g','a'.repeat(81)),product()],'standard'))
  assert.doesNotThrow(()=>comparePrices([product('1000000000','1000000000'),product('0','0.000001')],'standard'))
})
test('単価: 入力不変・商品削除後の比較と整数オラクル100組', () => {
  const inputs=[product('100','200'),product('200','300'),product('300','400')];const before=structuredClone(inputs)
  comparePrices(inputs,'standard');assert.deepEqual(inputs,before)
  assert.equal(comparePrices(inputs.slice(1),'standard').products[0].status,'最安')
  for(let i=1;i<=100;i++) {
    const a={p:i*7,q:i+13},b={p:i*11,q:i+31}
    const result=comparePrices([product(String(a.p),String(a.q)),product(String(b.p),String(b.q))],'standard')
    const difference=a.p*b.q-b.p*a.q
    assert.equal(result.products[0].status,difference<0?'最安':difference===0?'最安（同値）':'')
  }
})
test('レシピ: 人数・倍率・小数・全角・0量・卵を整数化しない', () => {
  const result=scaleRecipe([ingredient(),ingredient('１００．５','g','粉'),ingredient('0','mL','水')],people('２','３'),3)
  assert.equal(result.scale,'2人分 → 3人分')
  assert.deepEqual(result.ingredients.map(p=>p.amount),['1.5','150.75','0'])
  assert.deepEqual(scaleRecipe([ingredient('0.5')],factor('０．５'),3).ingredients,[ingredient('0.25')])
  assert.equal(scaleRecipe([ingredient('4')],people('1.5','0.75'),3).ingredients[0].amount,'2')
  assert.ok(recipeSummary(result).includes('卵：1.5 個'))
})
test('レシピ: 適量・少々と自由な単位を保持し重量体積換算をしない', () => {
  const inputs=[ingredient(' 適量 ','','塩'),ingredient('少々','つまみ','胡椒'),ingredient('1','大さじ','油'),ingredient('5','g','水')]
  const result=scaleRecipe(inputs,factor('2'),3)
  assert.deepEqual(result.ingredients,[ingredient('適量','','塩'),ingredient('少々','つまみ','胡椒'),ingredient('2','大さじ','油'),ingredient('10','g','水')])
})
test('レシピ: 四捨五入・正の微小量・表示桁数と人数比の循環小数', () => {
  assert.equal(scaleRecipe([ingredient('1.005')],factor('1'),2).ingredients[0].amount,'1.01')
  assert.equal(scaleRecipe([ingredient('2.5')],factor('1'),0).ingredients[0].amount,'3')
  assert.equal(scaleRecipe([ingredient('1')],people('3','1'),3).ingredients[0].amount,'0.333')
  assert.equal(scaleRecipe([ingredient('0.000001')],factor('0.000001'),6).ingredients[0].amount,'0.000001未満')
  assert.equal(scaleRecipe([ingredient('0.1')],factor('1'),0).ingredients[0].amount,'1未満')
  for(let places=0;places<=6;places++) assert.equal(scaleRecipe([ingredient('1')],factor('1'),places).ingredients[0].amount,'1')
})
test('レシピ: 空欄・0人数・不正・上限・行数を拒否し20材料に対応', () => {
  const max=Array.from({length:20},(_,i)=>ingredient('1','g',`材料${i}`));assert.equal(scaleRecipe(max,people(),3).ingredients.length,20)
  for(const rows of [[],[...max,ingredient()],[ingredient('')],[ingredient('-1')],[ingredient('1/2')],[ingredient('1e2')],[ingredient('1','g','')],[ingredient('1','g','a'.repeat(81))],[ingredient('1','a'.repeat(21))]])assert.throws(()=>scaleRecipe(rows,people(),3))
  for(const text of ['','0','-1','NaN','1e3','10000.000001','0.0000001']) {
    assert.throws(()=>scaleRecipe([ingredient()],people(text,'1'),3),text)
    assert.throws(()=>scaleRecipe([ingredient()],people('1',text),3),text)
    assert.throws(()=>scaleRecipe([ingredient()],factor(text),3),text)
  }
  assert.throws(()=>scaleRecipe([ingredient()],people('0.000001','1'),3),/倍率/)
  assert.throws(()=>scaleRecipe([ingredient('1000000000')],factor('10000'),3),/大きすぎ/)
  assert.equal(scaleRecipe([ingredient('100000000')],factor('10000'),3).ingredients[0].amount,'1000000000000')
  for(const places of [-1,7,1.5,NaN])assert.throws(()=>scaleRecipe([ingredient()],people(),places))
  assert.throws(()=>scaleRecipe([ingredient()],{...people(),mode:'missing'},3))
})
test('レシピ: 入力不変と設定変更後の再計算・100通りの比例', () => {
  const rows=[ingredient('2')],settings=people();const before=structuredClone(rows);scaleRecipe(rows,settings,3);assert.deepEqual(rows,before)
  assert.equal(scaleRecipe(rows,people('2','4'),3).ingredients[0].amount,'4')
  assert.equal(scaleRecipe([ingredient('3')],people('2','4'),3).ingredients[0].amount,'6')
  for(let amount=0;amount<100;amount++)assert.equal(scaleRecipe([ingredient(String(amount))],people('2','4'),3).ingredients[0].amount,String(amount*2))
})
test('数値・文字: 有限範囲・全角・丸め・制御文字の拒否', () => {
  assert.equal(formatFraction(parseAmount(' +.5 ','量'),6),'0.5')
  assert.equal(formatFraction({numerator:1n,denominator:3n},2),'0.33')
  assert.equal(formatFraction({numerator:2n,denominator:3n},2),'0.67')
  for(const name of ['a\nb','a\0b','a\tb'])assert.throws(()=>scaleRecipe([ingredient('1','g',name)],people(),3))
})
test('追加2ツール: 登録・検索・関連導線・保存ID・旧23件維持・HTML安全性', () => {
  const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8')
  const old=['image-resizer','image-joiner','holiday-style','pocket-companion','unit-converter','bill-splitter','roulette-picker','json-formatter','sql-in-generator','timestamp-converter','character-counter','url-encode-decode','base64-encode-decode','uuid-generator','date-calculator','japanese-era-converter','qr-code-generator','text-diff','ipv4-cidr','sha256','radix-converter','html-escape','percentage-calculator']
  assert.ok(old.every(id=>tools.some(tool=>tool.id===id)))
  for(const [id,component,query] of [['unit-price-comparison','UnitPriceComparison','どっちが安い'],['recipe-scaler','RecipeScaler','何人分']]) {
    const tool=tools.find(tool=>tool.id===id);assert.equal(tool.category,'general');assert.ok(app.includes(`<Route path="${tool.path}" element={<${component} />} />`))
    assert.ok(filterToolList(tools,query,'general').some(tool=>tool.id===id))
    let shelf=updateShelf(emptyShelf(),{type:'favorite',id});shelf=updateShelf(shelf,{type:'visit',id});assert.deepEqual(parseShelf(JSON.stringify(shelf)),shelf)
    for(const related of tool.relatedTools)assert.ok(tools.some(tool=>tool.id===related))
  }
  for(const [component,file] of [[UnitPriceComparison,'unit-price-comparison/UnitPriceComparison.tsx'],[RecipeScaler,'recipe-scaler/RecipeScaler.tsx']]) {
    const markup=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(component)));assert.ok(markup.includes('保存・送信・URLへの埋め込みはしません'));assert.ok(markup.includes('関連ツール'))
    const source=readFileSync(new URL('../src/tools/'+file,import.meta.url),'utf8');assert.ok(!/localStorage|sessionStorage|URLSearchParams|fetch\s*\(|sendBeacon|dangerouslySetInnerHTML/.test(source))
  }
  const name='<script>bad</script>'
  const output=recipeSummary(scaleRecipe([ingredient('1','g',name)],people(),3))
  const markup=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(CalculationPage,{title:'test',description:'',usage:'',related:[],onReset(){},result:{output,error:'',feedback:'',busy:false,copy(){}}},createElement('p',null,name))))
  assert.ok(!markup.includes('<script>'));assert.ok(markup.includes('&lt;script&gt;bad&lt;/script&gt;'))
})
