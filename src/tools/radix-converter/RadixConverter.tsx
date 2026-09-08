import { useState } from 'react'
import BrowserTool, { useToolResult } from '../../components/tools/BrowserTool'

export function convertRadix(input: string, radix: number): string {
  if (![2, 8, 10, 16].includes(radix)) throw new Error('入力基数を2・8・10・16から選択してください。')
  let digits = input.trim()
  const negative = digits.startsWith('-')
  if (/^[+-]/.test(digits)) digits = digits.slice(1)
  const prefix = /^(0[bBoOxX])/.exec(digits)?.[0]
  if (prefix) {
    const prefixRadix = { b: 2, o: 8, x: 16 }[prefix.charAt(1).toLowerCase()]
    if (prefixRadix !== radix) throw new Error('接頭辞と入力基数が一致しません。')
    digits = digits.slice(2)
  }
  if (!digits || digits.length > 4096) throw new Error('数字部分を1〜4096桁で入力してください。')
  const patterns: Record<number, RegExp> = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9a-f]+$/i }
  if (!patterns[radix]?.test(digits)) throw new Error('選択した基数で使えない桁が含まれています。小数・指数表記・桁区切りは使用できません。')
  const prefixes: Record<number, string> = { 2: '0b', 8: '0o', 10: '', 16: '0x' }
  const absolute = BigInt(`${prefixes[radix]}${digits}`)
  const value = negative ? -absolute : absolute
  return [2, 8, 10, 16].map(base => `${base}進数: ${value.toString(base)}`).join('\n')
}

export default function RadixConverter() {
  const [input, setInput] = useState('')
  const [radix, setRadix] = useState(10)
  const result = useToolResult()
  return (
    <BrowserTool title="進数変換" description="整数を2・8・10・16進数へ相互変換します。" result={result}
      onClear={() => { setInput(''); setRadix(10); result.reset() }}
      usage={<>
        <p>入力基数を選び、整数を入力して変換します。BigIntを使い、Numberを経由せず整数の精度を維持します。数字部分は最大4096桁です。</p>
        <p>前後の空白、先頭の+または-、先頭ゼロを許容します。0b・0o・0xは入力基数と一致する場合のみ使えます（大文字も可）。10進数の接頭辞はありません。符号は接頭辞より前に置きます。</p>
        <p>出力は接頭辞・不要な先頭ゼロなし、英字は小文字です。負数はマイナス表記で、2の補数表現にはしません。-0は0に統一します。小数、指数表記、内部の空白、桁区切り、不正な桁は拒否します。ただし16進数のeは通常の数字として扱います。</p>
      </>}>
      <label className="field-label" htmlFor="radix-base">入力基数</label>
      <select id="radix-base" value={radix} onChange={event => { setRadix(Number(event.target.value)); result.reset() }}>
        {[2, 8, 10, 16].map(base => <option key={base} value={base}>{base}進数</option>)}
      </select>
      <label className="field-label" htmlFor="radix-input">整数</label>
      <textarea id="radix-input" rows={5} value={input} spellCheck={false} onChange={event => { setInput(event.target.value); result.reset() }} />
      <div className="action-row"><button type="button" className="primary-button" disabled={result.busy} onClick={() => void result.run(() => convertRadix(input, radix))}>変換</button></div>
    </BrowserTool>
  )
}
