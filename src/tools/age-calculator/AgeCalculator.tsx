import { useRef, useState } from 'react'
import DatePartsInput from '../../components/forms/DatePartsInput'
import type { DatePartsValue } from '../../components/forms/dateParts'
import CalculationPage from '../everyday-calculations/CalculationPage'
import { useToolResult } from '../../components/tools/useToolResult'
import { calculateElapsed, elapsedText, localTodayParts } from './elapsed'
import type { ElapsedResult } from './elapsed'
import './AgeCalculator.css'
const emptyDate = (): DatePartsValue => ({ year: '', month: '', day: '' })
export default function AgeCalculator() {
  const [start, setStart] = useState(emptyDate)
  const [reference, setReference] = useState(localTodayParts)
  const [calculated, setCalculated] = useState<ElapsedResult | null>(null)
  const form = useRef<HTMLFormElement>(null)
  const result = useToolResult()
  const resetResult = () => { setCalculated(null); result.reset() }
  return <CalculationPage title="経過年月・年齢計算" description="誕生日や記念日から、基準日までの年・月・日と総日数を計算します。" result={result} related={['date-calculator']} onReset={() => { setStart(emptyDate()); setReference(localTodayParts()); resetResult(); form.current?.querySelector<HTMLInputElement>('#age-start-year')?.focus() }} usage={<><p>開始日と基準日を入力して計算します。基準日の初期値は端末の今日の日付です。同じ日は0日、開始日は総日数に加算しません。グレゴリオ暦として、西暦0001〜9999年の有効な日付に対応します。</p><p>月の区切りは開始日と同じ日です。その日がない月は月末に補正し、12か月を1年として、直近の区切りからの残り日数を表示します。1月31日から2月28日は1か月、3月30日は1か月30日です。2月29日の1年後が平年なら2月28日を区切りにします。</p><p>日付の経過計算です。法律上の年齢判定や資格判断には使いません。</p></>}>
    <form ref={form} onSubmit={event => { event.preventDefault(); void result.run(() => { const next = calculateElapsed(start, reference); setCalculated(next); return elapsedText(next) }) }}>
      <div className="age-date-fields"><div><label className="field-label" id="age-start-label" htmlFor="age-start-year">開始日（誕生日・記念日など）</label><DatePartsInput id="age-start" value={start} labelledBy="age-start-label" describedBy={'age-rule' + (result.error ? ' calculation-error' : '')} onChange={next => { if (next.year !== start.year || next.month !== start.month || next.day !== start.day) { setStart(next); resetResult() } }} /></div><div><label className="field-label" id="age-reference-label" htmlFor="age-reference-year">基準日</label><DatePartsInput id="age-reference" value={reference} labelledBy="age-reference-label" describedBy={'age-rule' + (result.error ? ' calculation-error' : '')} onChange={next => { if (next.year !== reference.year || next.month !== reference.month || next.day !== reference.day) { setReference(next); resetResult() } }} /></div></div>
      <p className="calculation-help" id="age-rule">開始日と同じ日を月の区切りにし、その日がない月は月末へ補正します。12か月＝1年です。</p>
      <button id="age-calculate" type="submit" className="primary-button" disabled={result.busy}>経過を計算する</button>
    </form>
    {result.output !== null && calculated && <div id="age-result" className="age-result" role="region" aria-label="計算結果"><p><span>経過年月</span><strong>満{calculated.years}年 {calculated.months}か月 {calculated.days}日</strong></p><p><span>総日数</span><strong>{calculated.totalDays.toLocaleString('ja-JP')}日</strong></p></div>}
  </CalculationPage>
}
