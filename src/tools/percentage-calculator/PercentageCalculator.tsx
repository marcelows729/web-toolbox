import { useState } from 'react'
import BrowserTool, { useToolResult } from '../../components/tools/BrowserTool'

export type PercentageMode = 'ratio' | 'portion' | 'change'
type Decimal = { coefficient: bigint; scale: bigint }

function parseDecimal(input: string): Decimal {
  const value = input.trim()
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value)) {
    throw new Error('10進数を入力してください。指数表記・桁区切り・末尾だけの小数点は使用できません。')
  }
  const unsigned = value.replace(/^[+-]/, '')
  const [integer = '', fraction = ''] = unsigned.split('.')
  if (integer.length + fraction.length > 100 || fraction.length > 20) {
    throw new Error('各入力は数字100桁以内、小数部20桁以内にしてください。')
  }
  const coefficient = BigInt(`${integer || '0'}${fraction}`) * BigInt(value.startsWith('-') ? -1 : 1)
  return { coefficient, scale: BigInt(10) ** BigInt(fraction.length) }
}

function roundFraction(numerator: bigint, denominator: bigint, places: number): string {
  if (denominator === BigInt(0)) throw new Error('分母（全体または変更前の値）が0のため計算できません。')
  const negative = (numerator < BigInt(0)) !== (denominator < BigInt(0))
  const absoluteNumerator = numerator < BigInt(0) ? -numerator : numerator
  const absoluteDenominator = denominator < BigInt(0) ? -denominator : denominator
  const scaled = absoluteNumerator * BigInt(10) ** BigInt(places)
  let rounded = scaled / absoluteDenominator
  if ((scaled % absoluteDenominator) * BigInt(2) >= absoluteDenominator) rounded += BigInt(1)
  const digits = rounded.toString().padStart(places + 1, '0')
  const body = places === 0 ? digits : `${digits.slice(0, -places)}.${digits.slice(-places)}`
  return `${negative && rounded !== BigInt(0) ? '-' : ''}${body}`
}

export function calculatePercentage(mode: PercentageMode, first: string, second: string, places: number): string {
  if (!Number.isInteger(places) || places < 0 || places > 10) throw new Error('表示小数桁数を0〜10から選択してください。')
  const a = parseDecimal(first)
  const b = parseDecimal(second)
  const hundred = BigInt(100)
  switch (mode) {
    case 'ratio':
      return `${roundFraction(a.coefficient * b.scale * hundred, b.coefficient * a.scale, places)}%`
    case 'portion':
      return roundFraction(a.coefficient * b.coefficient, a.scale * b.scale * hundred, places)
    case 'change':
      return `${roundFraction((b.coefficient * a.scale - a.coefficient * b.scale) * hundred, a.coefficient * b.scale, places)}%`
    default:
      throw new Error('計算方法を選択してください。')
  }
}

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
      <select id="percentage-mode" value={mode} onChange={event => { setMode(event.target.value as PercentageMode); setFirst(''); setSecond(''); result.reset() }}>
        <option value="ratio">全体に対する割合</option><option value="portion">指定割合の値</option><option value="change">増減率</option>
      </select>
      <label className="field-label" htmlFor="percentage-first">{labels[mode][0]}</label>
      <input id="percentage-first" type="text" value={first} onChange={event => { setFirst(event.target.value); result.reset() }} />
      <label className="field-label" htmlFor="percentage-second">{labels[mode][1]}</label>
      <input id="percentage-second" type="text" value={second} onChange={event => { setSecond(event.target.value); result.reset() }} />
      <label className="field-label" htmlFor="percentage-places">表示小数桁数</label>
      <select id="percentage-places" value={places} onChange={event => { setPlaces(Number(event.target.value)); result.reset() }}>
        {Array.from({ length: 11 }, (_, value) => <option key={value} value={value}>{value}桁</option>)}
      </select>
      <div className="action-row"><button type="button" className="primary-button" disabled={result.busy} onClick={() => void result.run(() => calculatePercentage(mode, first, second, places))}>計算</button></div>
    </BrowserTool>
  )
}
