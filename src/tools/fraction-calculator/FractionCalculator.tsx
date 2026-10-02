import { useRef, useState } from 'react'
import CalculationPage from '../everyday-calculations/CalculationPage'
import { useToolResult } from '../../components/tools/useToolResult'
import { calculateFractions, FRACTION_OPERATIONS, fractionSummary, initialFractions, validateFractionInput } from './fraction'
import type { FractionOperation, FractionResult, FractionValues } from './fraction'

export default function FractionCalculator() {
  const [values, setValues] = useState(initialFractions)
  const [operation, setOperation] = useState<FractionOperation>('add')
  const [calculated, setCalculated] = useState<FractionResult | null>(null)
  const [inputError, setInputError] = useState('')
  const firstInput = useRef<HTMLInputElement>(null)
  const result = useToolResult()
  const clearResult = () => { setCalculated(null); result.reset() }
  const accept = (field: keyof FractionValues, value: string) => {
    clearResult()
    try { validateFractionInput(value); setValues(current => ({ ...current, [field]: value })); setInputError(''); return true }
    catch (cause) { setInputError((cause as Error).message + ' 直前の入力を保持しています。'); return false }
  }
  const described = `fraction-help${inputError ? ' fraction-input-error' : ''}${result.error ? ' calculation-error' : ''}`
  return <CalculationPage title="分数計算" description="2つの分数を足す・引く・掛ける・割る。約分した答えを正確に求めます。" result={result} related={['percentage-calculator', 'aspect-ratio']} onReset={() => { setValues(initialFractions()); setOperation('add'); setInputError(''); clearResult(); firstInput.current?.focus() }} usage={<><p>分数1と分数2の分子・分母を入力し、計算方法を選んで「計算する」を押します。例：1/2と1/3を足すと5/6です。分母に負の整数も使えます。答えの分母は正にそろえ、最大公約数で約分します。分母が1なら整数、0は「0」と表示します。</p><p>各欄は符号を除いて18桁以内の整数です。先頭の0も桁数に含め、前後の空白・符号を含む入力は1欄32文字までです。全角数字・＋・－と「−」も使えます。空欄、小数、カンマ、指数表記、分母0は使えません。割る場合は分数2の分子も0以外にしてください。</p><p>整数演算で正確に計算し、小数への丸めはしません。仮分数は帯分数も併記します。「1 + 1/6」は1と1/6、負の「−(1 + 1/6)」は全体を負にした値です。小数・式・帯分数をそのまま入力する機能はありません。</p></>}>
    <form onSubmit={event => { event.preventDefault(); if (inputError) return; setCalculated(null); void result.run(() => { const next = calculateFractions(values, operation); setCalculated(next); return fractionSummary(next) }) }}>
      <div className="fraction-inputs">{(['first', 'second'] as const).map((prefix, index) => <fieldset key={prefix} className="calculation-row fraction-input"><legend>分数{index + 1}</legend>{(['Numerator', 'Denominator'] as const).map(part => {
        const field = `${prefix}${part}` as keyof FractionValues, label = part === 'Numerator' ? '分子' : '分母'
        return <label key={field} className="field-label" htmlFor={'fraction-' + field}>{label}<input ref={field === 'firstNumerator' ? firstInput : undefined} id={'fraction-' + field} type="text" inputMode="text" autoComplete="off" spellCheck={false} aria-describedby={described} value={values[field]} onChange={event => accept(field, event.target.value)} onPaste={event => {
          event.preventDefault(); const el = event.currentTarget, begin = el.selectionStart ?? 0, end = el.selectionEnd ?? begin, pasted = event.clipboardData.getData('text/plain')
          if (accept(field, values[field].slice(0, begin) + pasted + values[field].slice(end))) requestAnimationFrame(() => el.setSelectionRange(begin + pasted.length, begin + pasted.length))
        }} /></label>
      })}</fieldset>)}</div>
      <label className="field-label fraction-operation" htmlFor="fraction-operation">計算方法<select id="fraction-operation" aria-describedby={described} value={operation} onChange={event => { setOperation(event.target.value as FractionOperation); clearResult() }}>{FRACTION_OPERATIONS.map(item => <option key={item.value} value={item.value}>{item.label}（{item.symbol}）</option>)}</select></label>
      <p id="fraction-help" className="calculation-help">分子・分母は整数、正負18桁以内。分母は0以外。負号は「-」で入力できます。</p>
      {inputError && <p id="fraction-input-error" className="error-box" role="alert">{inputError}</p>}
      <button id="fraction-calculate" type="submit" className="primary-button" disabled={result.busy || !!inputError}>計算する</button>
    </form>
    {calculated && <section className="calculation-result fraction-result" aria-labelledby="fraction-result-title"><h2 id="fraction-result-title">計算結果</h2><p id="fraction-expression" className="calculation-help">{calculated.expression}</p><dl><div><dt>約分した答え</dt><dd id="fraction-answer">{calculated.exact}</dd></div>{calculated.mixed && <div><dt>帯分数</dt><dd id="fraction-mixed">{calculated.mixed}</dd></div>}</dl></section>}
  </CalculationPage>
}
