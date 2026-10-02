import { useState } from 'react'
import BrowserTool from '../../components/tools/BrowserTool'
import { useToolResult } from '../../components/tools/useToolResult'

import { calculatePercentage, type PercentageMode } from './percentage'

const labels: Record<PercentageMode, [string, string]> = {
  ratio: ['部分の値', '全体の値（分母）'],
  portion: ['元の値', '割合（%）'],
  change: ['変更前の値（分母）', '変更後の値'],
}

export default function PercentageCalculator() {
  const [mode, setMode] = useState<PercentageMode>('ratio')
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [places, setPlaces] = useState(2)
  const result = useToolResult()
  return (
    <BrowserTool title="割合・増減率計算" description="割合、指定割合の値、変更前後の増減率を計算します。" result={result}
      onClear={() => { setMode('ratio'); setFirst(''); setSecond(''); setPlaces(2); result.reset() }}
      usage={<>
        <p>割合は「部分÷全体×100」、指定割合の値は「元の値×割合÷100」、増減率は「（変更後−変更前）÷変更前×100」で計算します。</p>
        <p>負数と100%を超える割合も許容します。分母が0の割合・増減率は計算できません。増減率の分母には変更前の符号をそのまま使うため、-100から-50への変化は-50%です。指定割合の計算では元の値が0でも計算できます。</p>
        <p>入力は10進数で、前後の空白と先頭の符号を許容します。各入力は数字100桁以内、小数部20桁以内です。小数を整数と倍率に分けてBigIntで計算し、結果だけを指定の小数0〜10桁（初期値2桁）に四捨五入します。ちょうど半分は絶対値が大きい側へ丸め、負のゼロは表示しません。末尾のゼロは保持します。</p>
      </>}>
      <label className="field-label" htmlFor="percentage-mode">計算方法</label>
      <select aria-describedby={result.error ? 'tool-error' : undefined} id="percentage-mode" value={mode} onChange={event => { setMode(event.target.value as PercentageMode); setFirst(''); setSecond(''); result.reset() }}>
        <option value="ratio">全体に対する割合</option><option value="portion">指定割合の値</option><option value="change">増減率</option>
      </select>
      <label className="field-label" htmlFor="percentage-first">{labels[mode][0]}</label>
      <input aria-describedby={result.error ? 'tool-error' : undefined} id="percentage-first" type="text" value={first} onChange={event => { setFirst(event.target.value); result.reset() }} />
      <label className="field-label" htmlFor="percentage-second">{labels[mode][1]}</label>
      <input aria-describedby={result.error ? 'tool-error' : undefined} id="percentage-second" type="text" value={second} onChange={event => { setSecond(event.target.value); result.reset() }} />
      <label className="field-label" htmlFor="percentage-places">表示小数桁数</label>
      <select aria-describedby={result.error ? 'tool-error' : undefined} id="percentage-places" value={places} onChange={event => { setPlaces(Number(event.target.value)); result.reset() }}>
        {Array.from({ length: 11 }, (_, value) => <option key={value} value={value}>{value}桁</option>)}
      </select>
      <div className="action-row"><button type="button" className="primary-button" disabled={result.busy} onClick={() => void result.run(() => calculatePercentage(mode, first, second, places))}>計算</button></div>
    </BrowserTool>
  )
}
