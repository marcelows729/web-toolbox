import { useState } from 'react'
import BrowserTool, { useToolResult } from '../../components/tools/BrowserTool'

const escaped: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
const decoded: Record<number, string> = { 38: '&', 60: '<', 62: '>', 34: '"', 39: "'" }

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, character => escaped[character] ?? character)
}

export function unescapeHtml(input: string): string {
  // 一度の置換のみ。置換によって新しく現れた文字参照を再解釈しない。
  return input.replace(/&(?:amp|lt|gt|quot|apos|#[0-9]+|#[xX][0-9a-fA-F]+);/g, reference => {
    const body = reference.slice(1, -1)
    if (!body.startsWith('#')) return named[body] ?? reference
    const hexadecimal = /^#[xX]/.test(body)
    const code = Number.parseInt(body.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10)
    return decoded[code] ?? reference
  })
}

export default function HtmlEscape() {
  const [input, setInput] = useState('')
  const result = useToolResult()
  return (
    <BrowserTool title="HTMLエスケープ・解除" description="HTMLの基本5文字と対応する文字参照を変換します。" result={result}
      onClear={() => { setInput(''); result.reset() }}
      usage={<>
        <p>{'エスケープでは & < > " とシングルクォートを、それぞれ &amp; &lt; &gt; &quot; &#39; に変換します。空入力も有効です。既存の文字参照の & もエスケープします。'}</p>
        <p>{'解除対象は小文字の &amp; &lt; &gt; &quot; &apos; と、同じ5文字を表す10進・16進数値文字参照（例: &#39;、&#x27;）のみです。数値の先頭ゼロ、x/X、16進数の英字大小を許容し、セミコロンは必須です。その他の文字参照（&nbsp;など）は変更しません。'}</p>
        <p>{'解除は1回だけです。&amp;lt; は &lt; まで戻し、< までは戻しません。結果は読み取り専用テキスト欄に表示し、HTMLとして実行しません。この機能はHTML全体の無害化やURL・JavaScriptの安全性検証を行うものではありません。'}</p>
      </>}>
      <label className="field-label" htmlFor="html-input">変換するテキスト</label>
      <textarea id="html-input" rows={10} value={input} spellCheck={false} onChange={event => { setInput(event.target.value); result.reset() }} />
      <div className="action-row">
        <button type="button" className="primary-button" disabled={result.busy} onClick={() => void result.run(() => escapeHtml(input))}>エスケープ</button>
        <button type="button" className="primary-button" disabled={result.busy} onClick={() => void result.run(() => unescapeHtml(input))}>解除</button>
      </div>
    </BrowserTool>
  )
}
