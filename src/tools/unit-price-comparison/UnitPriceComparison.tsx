import { useRef, useState } from 'react'
import CalculationPage from '../everyday-calculations/CalculationPage'
import { useToolResult } from '../../components/tools/useToolResult'
import { comparePrices, PRICE_UNITS, priceSummary } from './price'
import type { PriceBasis, PriceComparison, ProductInput } from './price'

type Row = ProductInput & { id: number }
const emptyRows = (): Row[] => [1, 2].map(id => ({ id, name: '', price: '', amount: '', unit: 'g' }))
export default function UnitPriceComparison() {
  const [rows, setRows] = useState<Row[]>(emptyRows)
  const [basis, setBasis] = useState<PriceBasis>('standard')
  const [comparison, setComparison] = useState<PriceComparison | null>(null)
  const nextId = useRef(3)
  const result = useToolResult()
  const clear = () => { setComparison(null); result.reset() }
  const update = (id: number, patch: Partial<ProductInput>) => { setRows(current => current.map(row => row.id === id ? { ...row, ...patch } : row)); clear() }
  const add = () => { if (rows.length >= 4) return; const id = nextId.current++; setRows([...rows, { id, name: '', price: '', amount: '', unit: rows[0].unit }]); clear(); requestAnimationFrame(() => document.getElementById(`product-name-${id}`)?.focus()) }
  const remove = (id: number) => { if (rows.length <= 2) return; const index = rows.findIndex(row => row.id === id); const remaining = rows.filter(row => row.id !== id); setRows(remaining); clear(); requestAnimationFrame(() => document.getElementById(`product-name-${remaining[Math.min(index, remaining.length - 1)].id}`)?.focus()) }
  return <CalculationPage title="買い物の単価比較" description="内容量や個数が違う商品を、同じ量の価格で比べます。" result={result} onReset={() => { setRows(emptyRows()); setBasis('standard'); nextId.current = 3; clear() }} related={['bill-splitter', 'unit-converter', 'recipe-scaler']} usage={<><p>2〜4商品の購入価格と内容量・個数を入力して「単価を比較」を押してください。購入価格は送料・手数料なども含めた合計額（円）を入れます。名前は省略できます。</p><p>gとkg、mLとLはそれぞれ換算できます。重さ・体積・個数をまたぐ比較はできません。密度を仮定した換算はしません。</p><p>価格は0〜10億円、量は0より大きく10億以下、小数6桁まで。全角数字も使えます。単価は小数2桁まで四捨五入します。最安・同値は丸める前の単価で判定するため、表示が同じでも判定が異なる場合があります。品質や使い切れる量も考えて選んでください。</p></>}>
    <form onSubmit={event => { event.preventDefault(); void result.run(() => { const next = comparePrices(rows, basis); setComparison(next); return priceSummary(next) }) }}>
      <p className="calculation-help">購入価格には送料なども含めて入力してください。</p>
      <div className="calculation-rows">{rows.map((row, index) => <fieldset className="calculation-row product-row" key={row.id}><legend>商品{index + 1}</legend>
        <label className="field-label" htmlFor={`product-name-${row.id}`}>名前（任意）<input id={`product-name-${row.id}`} type="text" maxLength={80} value={row.name} onChange={e => update(row.id, { name: e.target.value })} placeholder={`商品${index + 1}`} /></label>
        <div className="product-numbers"><label className="field-label" htmlFor={`product-price-${row.id}`}>購入価格（円）<input id={`product-price-${row.id}`} type="text" inputMode="decimal" maxLength={32} value={row.price} onChange={e => update(row.id, { price: e.target.value })} placeholder="298" /></label><label className="field-label" htmlFor={`product-amount-${row.id}`}>内容量・個数<input id={`product-amount-${row.id}`} type="text" inputMode="decimal" maxLength={32} value={row.amount} onChange={e => update(row.id, { amount: e.target.value })} placeholder="500" /></label><label className="field-label" htmlFor={`product-unit-${row.id}`}>単位<select id={`product-unit-${row.id}`} value={row.unit} onChange={e => update(row.id, { unit: e.target.value as ProductInput['unit'] })}>{PRICE_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}</select></label></div>
        <button type="button" className="secondary-button row-remove" disabled={rows.length <= 2} onClick={() => remove(row.id)} aria-label={`商品${index + 1}を削除`}>削除</button>
      </fieldset>)}</div>
      <div className="action-row calculation-row-actions"><button id="product-add" type="button" className="secondary-button" disabled={rows.length >= 4} onClick={add}>商品を追加（最大4件）</button></div>
      <label className="field-label calculation-basis" htmlFor="price-basis">比較する基準量<select id="price-basis" value={basis} onChange={e => { setBasis(e.target.value as PriceBasis); clear() }}><option value="standard">100g / 100mL / 1個</option><option value="large">1,000g / 1,000mL / 10個</option></select></label>
      <button id="price-calculate" className="primary-button" type="submit" disabled={result.busy}>単価を比較</button>
    </form>
    {comparison && <section className="calculation-result" aria-labelledby="price-result-title"><h2 id="price-result-title">{comparison.basis}あたりの価格</h2><ul className="price-results">{comparison.products.map((item, index) => <li key={rows[index].id}><div><strong>{item.name}</strong><small>購入価格 {item.price}円 / {item.amount}{item.unit}</small></div><div className="price-result-value"><strong>{item.unitPrice}円</strong>{item.status && <span>{item.status}</span>}</div></li>)}</ul><p className="calculation-help">最安・同値は丸める前の単価で判定しています。</p></section>}
  </CalculationPage>
}
