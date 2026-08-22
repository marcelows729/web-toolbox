import { useMemo, useState } from 'react'

type EncodeMode = 'component' | 'full-url'

const getEncodedValue = (text: string, mode: EncodeMode) =>
  mode === 'component' ? encodeURIComponent(text) : encodeURI(text)

const getDecodedValue = (text: string, mode: EncodeMode) => {
  if (mode === 'component') {
    return decodeURIComponent(text)
  }

  return decodeURI(text)
}

const getEmptyStateError = (action: 'encode' | 'decode') => {
  if (action === 'encode') {
    return '入力が空のため、エンコード結果はありません。'
  }

  return '入力が空のため、デコード結果はありません。'
}

export default function UrlEncodeDecode() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [encodeMode, setEncodeMode] = useState<EncodeMode>('component')

  const hasOutput = useMemo(() => output.trim().length > 0, [output])

  const handleEncode = () => {
    if (!input) {
      setOutput('')
      setError(getEmptyStateError('encode'))
      return
    }

    setError('')
    setOutput(getEncodedValue(input, encodeMode))
  }

  const handleDecode = () => {
    if (!input) {
      setOutput('')
      setError(getEmptyStateError('decode'))
      return
    }

    try {
      setError('')
      setOutput(getDecodedValue(input, encodeMode))
    } catch (caughtError) {
      const errorMessage = caughtError instanceof URIError
        ? '正しくないURLエンコード形式が含まれています。'
        : 'URLのデコード中にエラーが発生しました。'

      setOutput('')
      setError(errorMessage)
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
    setCopyFeedback('')
    setEncodeMode('component')
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
        <h1>URL Encode / Decode</h1>
        <p>文字列やURLをURLエンコード・デコードします。</p>
      </header>

      <section className="tool-panel" aria-label="URL Encode / Decode">
        <div className="generator-grid">
          <label className="field-label" htmlFor="url-encode-input">
            Input
          </label>
          <textarea
            id="url-encode-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="変換したい文字列またはURLを入力してください。"
            rows={12}
          />

          <div className="generator-controls">
            <div className="option-group">
              <span className="option-label">Encode Mode</span>
              <div className="toggle-group" role="radiogroup" aria-label="URL変換モード">
                <button
                  type="button"
                  className={`toggle-option ${encodeMode === 'component' ? 'is-selected' : ''}`}
                  onClick={() => setEncodeMode('component')}
                  aria-pressed={encodeMode === 'component'}
                >
                  文字列 / パラメータ
                </button>
                <button
                  type="button"
                  className={`toggle-option ${encodeMode === 'full-url' ? 'is-selected' : ''}`}
                  onClick={() => setEncodeMode('full-url')}
                  aria-pressed={encodeMode === 'full-url'}
                >
                  URL全体
                </button>
              </div>
            </div>
          </div>

          <div className="action-row">
            <button type="button" className="primary-button" onClick={handleEncode}>Encode</button>
            <button type="button" className="primary-button" onClick={handleDecode}>Decode</button>
            <button type="button" className="secondary-button" onClick={handleClear}>Clear</button>
            <button type="button" className="secondary-button" onClick={handleCopy} disabled={!hasOutput}>Copy</button>
          </div>

          <label className="field-label" htmlFor="url-encode-output">
            Output
          </label>
          <textarea
            id="url-encode-output"
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
        <h2>URL Encode / Decodeとは</h2>
        <p>
          URL Encode / Decodeは、日本語・スペース・記号などをURLで安全に扱える形式へ変換したり、元の文字列へ戻したりするツールです。
          URLパラメータやWeb開発時のデータ確認などに利用できます。
        </p>
      </section>

      <section className="tool-info">
        <h2>文字列 / パラメータ</h2>
        <p>
          URLパラメータの値など、URLの一部分を変換する場合に使用します。
          例として、スペースは <strong>%20</strong> になります。
        </p>
      </section>

      <section className="tool-info">
        <h2>URL全体</h2>
        <p>
          URLの <strong>/</strong>、<strong>?</strong>、<strong>&amp;</strong> などの構造を維持しながら変換します。
        </p>
      </section>

      <section className="tool-info">
        <h2>使い方</h2>
        <ol>
          <li>変換したい文字列またはURLを入力します。</li>
          <li>変換モードを選択します。</li>
          <li>EncodeまたはDecodeを押します。</li>
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
