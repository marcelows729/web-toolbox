import { useState } from 'react'
import BrowserTool from '../../components/tools/BrowserTool'
import { useToolResult } from '../../components/tools/useToolResult'

import { escapeHtml, unescapeHtml } from './htmlEntities'

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
