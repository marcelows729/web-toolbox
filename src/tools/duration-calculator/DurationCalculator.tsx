import { useRef, useState } from 'react'
import CalculationPage from '../everyday-calculations/CalculationPage'
import { useToolResult } from '../../components/tools/useToolResult'
import { calculateDuration, durationSummary, formatDuration, MAX_ROWS } from './duration'
import type { DurationInput } from './duration'
type Row = DurationInput & { id: number }
const blank = (id: number): Row => ({ id, operation: 'add', hours: '', minutes: '', seconds: '' })
export default function DurationCalculator() {
  const [rows, setRows] = useState<Row[]>(() => [blank(1)])
  const [total, setTotal] = useState<number | null>(null)
  const nextId = useRef(2)
  const result = useToolResult()
  const clear = () => { setTotal(null); result.reset() }
  const update = (id: number, patch: Partial<DurationInput>) => { setRows(current => current.map(row => row.id === id ? { ...row, ...patch } : row)); clear() }
  const add = () => { if (rows.length >= MAX_ROWS) return; const id = nextId.current++; setRows([...rows, blank(id)]); clear(); requestAnimationFrame(() => document.getElementById('duration-hours-' + id)?.focus()) }
  const remove = (id: number) => { if (rows.length === 1) return; const index = rows.findIndex(row => row.id === id); const remaining = rows.filter(row => row.id !== id); setRows(remaining); clear(); requestAnimationFrame(() => document.getElementById('duration-hours-' + remaining[Math.min(index, remaining.length - 1)].id)?.focus()) }
  const reset = () => { setRows([blank(1)]); nextId.current = 2; clear(); requestAnimationFrame(() => document.getElementById('duration-hours-1')?.focus()) }
  const formatted = total === null ? null : formatDuration(total)
  return <CalculationPage title="時間の足し算・引き算" description="動画や作業の時間を、まとめて足したり引いたりします。" result={result} onReset={reset} related={['date-calculator', 'timestamp-converter', 'unit-converter']} usage={<><p>各行で「足す」「引く」を選び、時間・分・秒を入力して「合計を計算」を押してください。最大20行。空欄は0、全角数字も使えます。</p><p>時間は0〜999,999、分と秒は0〜59の整数です。小数・符号・単位・桁区切りは入力できません。引きたい時間は「引く」を選んでください。合計の絶対値の上限は71,999,999,980秒です。</p><p>24時間を超えても巻き戻しません。引いた量が大きい場合、マイナスは合計全体にかかります。差し引き0は符号なしの0時間0分0秒です。合計分は小数6桁まで四捨五入し、秒とHH:MM:SSは正確な整数秒で表示します。</p><p>日付や時刻、タイムゾーン、給与・法定労働時間の計算には使いません。</p></>}>
    <form onSubmit={event => { event.preventDefault(); void result.run(() => { const value = calculateDuration(rows); setTotal(value); return durationSummary(value) }) }}>
      <div className="calculation-rows">{rows.map((row, index) => <fieldset key={row.id} className="calculation-row duration-row"><legend>時間{index + 1}</legend>
        <label className="field-label" htmlFor={'duration-operation-' + row.id}>計算<select aria-describedby={result.error ? 'calculation-error' : undefined} id={'duration-operation-' + row.id} value={row.operation} onChange={event => update(row.id, { operation: event.target.value as DurationInput['operation'] })}><option value="add">足す（＋）</option><option value="subtract">引く（−）</option></select></label>
        <div className="duration-fields">{(['hours', 'minutes', 'seconds'] as const).map((key, i) => <label key={key} className="field-label" htmlFor={'duration-' + key + '-' + row.id}>{['時間', '分', '秒'][i]}<input aria-describedby={result.error ? 'calculation-error' : undefined} id={'duration-' + key + '-' + row.id} type="text" inputMode="numeric" maxLength={12} placeholder="0" value={row[key]} onChange={event => update(row.id, { [key]: event.target.value })} /></label>)}</div>
        <button type="button" className="secondary-button row-remove" disabled={rows.length === 1} onClick={() => remove(row.id)} aria-label={'時間' + (index + 1) + 'を削除'}>削除</button>
      </fieldset>)}</div>
      <div className="action-row calculation-row-actions"><button id="duration-add" type="button" className="secondary-button" onClick={add} disabled={rows.length >= MAX_ROWS}>時間を追加（{rows.length}/20行）</button><button id="duration-calculate" type="submit" className="primary-button" disabled={result.busy}>合計を計算</button></div>
    </form>
    {formatted && <section className="calculation-result" aria-labelledby="duration-result-title"><h2 id="duration-result-title">時間の合計</h2><p className="duration-total">{formatted.human}</p><dl className="recipe-results"><div><dt>HH:MM:SS</dt><dd>{formatted.clock}</dd></div><div><dt>合計分（小数6桁まで）</dt><dd>{formatted.minutes}分</dd></div><div><dt>合計秒</dt><dd>{formatted.seconds}秒</dd></div></dl></section>}
  </CalculationPage>
}
