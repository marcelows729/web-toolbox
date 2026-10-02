import { useState } from 'react'
import { useToolResult } from '../../components/tools/useToolResult'
import { toBase64, fromBase64, getEmptyStateError } from './conversion'

export default function Base64EncodeDecode() {
  const [input, setInput] = useState('')
  const result = useToolResult()
  const output = result.output ?? ''
  const error = result.error
  const copyFeedback = result.feedback
  const hasOutput = output.trim().length > 0
  const handleCopy = () => { if (hasOutput) void result.copy() }
  const resetResult = result.reset
  const handleEncode = () => { void result.run(() => {
    if (!input) throw new Error(getEmptyStateError('encode'))
    try { return toBase64(input) }
    catch { throw new Error('Base64への変換に失敗しました。') }
  }) }
  const handleDecode = () => { void result.run(() => {
    if (!input) throw new Error(getEmptyStateError('decode'))
    try { return fromBase64(input.replace(/\s+/g, '')) }
    catch { throw new Error('正しいBase64形式を入力してください。') }
  }) }
  const handleClear = () => { setInput(''); resetResult() }

  return (
    <div className="container tool-page">
      <header className="tool-header">
        <h1>Base64 Encode / Decode</h1>
        <p>テキストをBase64へエンコード・デコードします。</p>
      </header>

      <section className="tool-panel" aria-label="Base64 Encode / Decode">
        <div className="generator-grid">
          <label className="field-label" htmlFor="base64-input">
            Input
          </label>
          <textarea aria-describedby={error ? 'base64-encode-decode-error' : undefined}
            id="base64-input"
            value={input}
            onChange={(event) => { setInput(event.target.value); resetResult() }}
            placeholder="テキストまたはBase64を入力してください。"
            rows={12}
          />

          <div className="action-row">
            <button type="button" className="primary-button" onClick={handleEncode}>Encode</button>
            <button type="button" className="primary-button" onClick={handleDecode}>Decode</button>
            <button type="button" className="secondary-button" onClick={handleClear}>Clear</button>
            <button type="button" className="secondary-button" onClick={handleCopy} disabled={!hasOutput}>Copy</button>
          </div>

          <label className="field-label" htmlFor="base64-output">
            Output
          </label>
          <textarea
            id="base64-output"
            value={output}
            readOnly
            placeholder="エンコードまたはデコードされた結果がここに表示されます。"
            rows={12}
          />
        </div>

        {error && <div className="error-box" role="alert" id="base64-encode-decode-error">{error}</div>}
        {copyFeedback && (
          <div className="copy-feedback" role="status" aria-live="polite">
            {copyFeedback}
          </div>
        )}
      </section>

      <section className="tool-info">
        <h2>Base64 Encode / Decodeとは</h2>
        <p>
          Base64 Encode / Decodeは、テキストをBase64形式へ変換したり、Base64から元のテキストへ戻したりするツールです。
          日本語や絵文字を含むUTF-8テキストにも対応しています。
        </p>
      </section>

      <section className="tool-info">
        <h2>Base64について</h2>
        <p>
          Base64はデータの表現形式であり、暗号化ではありません。機密情報の保護目的には使用できません。
        </p>
      </section>

      <section className="tool-info">
        <h2>使い方</h2>
        <ol>
          <li>テキストまたはBase64を入力します。</li>
          <li>EncodeまたはDecodeを押します。</li>
          <li>結果を確認します。</li>
          <li>必要に応じてCopyします。</li>
        </ol>
      </section>

      <section className="tool-info">
        <h2>Privacy Information</h2>
        <p>
          このツールの処理はすべてブラウザ上で実行されます。入力したデータはサーバーへ送信されません。
        </p>
      </section>
    </div>
  )
}
