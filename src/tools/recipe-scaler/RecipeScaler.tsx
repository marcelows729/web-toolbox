import { useRef, useState } from 'react'
import CalculationPage from '../everyday-calculations/CalculationPage'
import { useToolResult } from '../../components/tools/useToolResult'
import { recipeSummary, scaleRecipe } from './recipe'
import type { IngredientInput, RecipeResult, RecipeScale } from './recipe'

type Row = IngredientInput & { id: number }
const emptyRows = (): Row[] => [{ id: 1, name: '', amount: '', unit: '' }]
const initialScale = (): RecipeScale => ({ mode: 'people', original: '2', target: '3', factor: '1.5' })
export default function RecipeScaler() {
  const [rows, setRows] = useState<Row[]>(emptyRows)
  const [settings, setSettings] = useState<RecipeScale>(initialScale)
  const [places, setPlaces] = useState(3)
  const [scaled, setScaled] = useState<RecipeResult | null>(null)
  const nextId = useRef(2)
  const result = useToolResult()
  const clear = () => { setScaled(null); result.reset() }
  const updateScale = (patch: Partial<RecipeScale>) => { setSettings(current => ({ ...current, ...patch })); clear() }
  const update = (id: number, patch: Partial<IngredientInput>) => { setRows(current => current.map(row => row.id === id ? { ...row, ...patch } : row)); clear() }
  const add = () => { if (rows.length >= 20) return; const id = nextId.current++; setRows([...rows, { id, name: '', amount: '', unit: '' }]); clear(); requestAnimationFrame(() => document.getElementById(`ingredient-name-${id}`)?.focus()) }
  const remove = (id: number) => { if (rows.length <= 1) return; const index = rows.findIndex(row => row.id === id); const remaining = rows.filter(row => row.id !== id); setRows(remaining); clear(); requestAnimationFrame(() => document.getElementById(`ingredient-name-${remaining[Math.min(index, remaining.length - 1)].id}`)?.focus()) }
  return <CalculationPage title="レシピの分量調整" description="人数や倍率に合わせて、材料の量をまとめて調整します。" result={result} onReset={() => { setRows(emptyRows()); setSettings(initialScale()); setPlaces(3); nextId.current = 2; clear() }} related={['unit-price-comparison', 'unit-converter', 'percentage-calculator']} usage={<><p>元の人数と作る人数、または倍率を指定し、材料を入力して「分量を計算」を押してください。材料は最大20行。量は小数で入力します。「適量」「少々」はそのまま残します。</p><p>人数・倍率は0より大きく10,000以下、材料の量は0〜10億、小数6桁まで。全角数字も使えます。調整倍率は10,000倍まで、結果は1兆以下です。表示は選んだ小数桁で四捨五入し、丸めて0になる正の量は「0.001未満」などと表示します。</p><p>単位は入力したまま残し、重さと体積の換算や卵などの整数化はしません。材料の比例計算による目安です。調理時間や味は同じ割合で変わるとは限らないため、様子を見ながら調整してください。</p></>}>
    <form onSubmit={event => { event.preventDefault(); void result.run(() => { const next = scaleRecipe(rows, settings, places); setScaled(next); return recipeSummary(next) }) }}>
      <fieldset className="recipe-mode"><legend>調整方法</legend><div className="toggle-group">{(['people', 'factor'] as const).map(mode => <button id={`recipe-mode-${mode}`} key={mode} type="button" aria-pressed={settings.mode === mode} className={`toggle-option ${settings.mode === mode ? 'is-selected' : ''}`} onClick={() => updateScale({ mode })}>{mode === 'people' ? '人数で調整' : '倍率で調整'}</button>)}</div></fieldset>
      {settings.mode === 'people' ? <div className="everyday-columns recipe-scale-inputs"><label className="field-label" htmlFor="recipe-original">元の人数<input aria-describedby={result.error ? 'calculation-error' : undefined} id="recipe-original" type="text" inputMode="decimal" maxLength={32} value={settings.original} onChange={e => updateScale({ original: e.target.value })} /></label><label className="field-label" htmlFor="recipe-target">作る人数<input aria-describedby={result.error ? 'calculation-error' : undefined} id="recipe-target" type="text" inputMode="decimal" maxLength={32} value={settings.target} onChange={e => updateScale({ target: e.target.value })} /></label></div> : <label className="field-label recipe-scale-inputs" htmlFor="recipe-factor">倍率<input aria-describedby={result.error ? 'calculation-error' : undefined} id="recipe-factor" type="text" inputMode="decimal" maxLength={32} value={settings.factor} onChange={e => updateScale({ factor: e.target.value })} /></label>}
      <p id="ingredient-amount-help" className="calculation-help">量は小数で入力します。1/2 は 0.5 と入力してください。「適量」「少々」も使えます。</p>
      <div className="calculation-rows">{rows.map((row, index) => <fieldset className="calculation-row ingredient-row" key={row.id}><legend>材料{index + 1}</legend><div className="ingredient-fields">
        <label className="field-label" htmlFor={`ingredient-name-${row.id}`}>材料名<input aria-describedby={result.error ? 'calculation-error' : undefined} id={`ingredient-name-${row.id}`} type="text" maxLength={80} value={row.name} onChange={e => update(row.id, { name: e.target.value })} placeholder="卵" /></label>
        <label className="field-label" htmlFor={`ingredient-amount-${row.id}`}>量<input aria-describedby={result.error ? 'ingredient-amount-help calculation-error' : 'ingredient-amount-help'} id={`ingredient-amount-${row.id}`} type="text" maxLength={32} value={row.amount} onChange={e => update(row.id, { amount: e.target.value })} placeholder="1 / 適量 / 少々" /></label>
        <label className="field-label" htmlFor={`ingredient-unit-${row.id}`}>単位（任意）<input aria-describedby={result.error ? 'calculation-error' : undefined} id={`ingredient-unit-${row.id}`} type="text" maxLength={20} value={row.unit} onChange={e => update(row.id, { unit: e.target.value })} placeholder="個 / g / 大さじ" /></label>
      </div><button type="button" className="secondary-button row-remove" disabled={rows.length <= 1} onClick={() => remove(row.id)} aria-label={`材料${index + 1}を削除`}>削除</button></fieldset>)}</div>
      <div className="action-row calculation-row-actions"><button id="ingredient-add" type="button" className="secondary-button" disabled={rows.length >= 20} onClick={add}>材料を追加（{rows.length}/20行）</button></div>
      <label className="field-label calculation-basis" htmlFor="recipe-places">表示する小数桁数<select aria-describedby={result.error ? 'calculation-error' : undefined} id="recipe-places" value={places} onChange={e => { setPlaces(Number(e.target.value)); clear() }}>{[0, 1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}桁</option>)}</select></label>
      <button id="recipe-calculate" type="submit" className="primary-button" disabled={result.busy}>分量を計算</button>
    </form>
    {scaled && <section className="calculation-result" aria-labelledby="recipe-result-title"><h2 id="recipe-result-title">調整した分量</h2><p>{scaled.scale}</p><dl className="recipe-results">{scaled.ingredients.map((item, index) => <div key={rows[index].id}><dt>{item.name}</dt><dd>{item.amount}{item.unit && ` ${item.unit}`}</dd></div>)}</dl><p className="calculation-help">分量の目安です。調理時間や味は様子を見ながら調整してください。</p></section>}
  </CalculationPage>
}
