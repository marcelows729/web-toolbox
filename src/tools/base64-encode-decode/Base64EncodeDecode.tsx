import { useMemo, useState } from 'react'

const toBase64 = (text: string) => {
  const bytes = new TextEncoder().encode(text)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

const fromBase64 = (base64Text: string) => {
  const normalized = base64Text.replace(/\s+/g, '')
  const binary = atob(normalized)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

const getEmptyStateError = (action: 'encode' | 'decode') => {
  if (action === 'encode') {
    return '入力が空のため、エンコード結果はありません。'
  }

  return '入力が空のため、デコード結果はありません。'
}

export default function Base64EncodeDecode() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')

  const hasOutput = useMemo(() => output.trim().length > 0, [output])

  const handleEncode = () => {
    if (!input) {
      setOutput('')
      setError(getEmptyStateError('encode'))
      return
    }

    try {
      setError('')
      setOutput(toBase64(input))
    } catch {
      setOutput('')
      setError('Base64への変換に失敗しました。')
    }
  }

  const handleDecode = () => {
    if (!input) {
      setOutput('')
      setError(getEmptyStateError('decode'))
      return
    }

    try {
      const normalized = input.replace(/\s+/g, '')
      setError('')
      setOutput(fromBase64(normalized))
    } catch {
      setOutput('')
      setError('正しいBase64形式を入力してください。')
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
    setCopyFeedback('')
  }

  const handleCopy = async () => {
    if (!hasOutput) {
      return
    }

    try {
      await navigator.clipboard.writeText(output)
      setCopyFeedback('コピーしました')
    } catch {
      setCopyFeedback('コピーに失敗しました')
    }
  }

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
          <textarea
            id="base64-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
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

        {error && <div className="error-box" role="alert">{error}</div>}
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
