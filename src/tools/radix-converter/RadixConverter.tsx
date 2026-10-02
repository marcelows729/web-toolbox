import { useState } from 'react'
import BrowserTool from '../../components/tools/BrowserTool'
import { useToolResult } from '../../components/tools/useToolResult'

import { convertRadix } from './radix'

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
      <select aria-describedby={result.error ? 'tool-error' : undefined} id="radix-base" value={radix} onChange={event => { setRadix(Number(event.target.value)); result.reset() }}>
        {[2, 8, 10, 16].map(base => <option key={base} value={base}>{base}進数</option>)}
      </select>
      <label className="field-label" htmlFor="radix-input">整数</label>
      <textarea aria-describedby={result.error ? 'tool-error' : undefined} id="radix-input" rows={5} value={input} spellCheck={false} onChange={event => { setInput(event.target.value); result.reset() }} />
      <div className="action-row"><button type="button" className="primary-button" disabled={result.busy} onClick={() => void result.run(() => convertRadix(input, radix))}>変換</button></div>
    </BrowserTool>
  )
}
