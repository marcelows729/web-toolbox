import { useEffect, useMemo, useState } from 'react'

const formatJson = (value: string) => {
  const parsed = JSON.parse(value)
  return JSON.stringify(parsed, null, 2)
}

const minifyJson = (value: string) => {
  const parsed = JSON.parse(value)
  return JSON.stringify(parsed)
}

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')

  const hasOutput = useMemo(() => output.trim().length > 0, [output])

  useEffect(() => {
    if (!copyFeedback) {
      return
    }

    const timer = window.setTimeout(() => {
      setCopyFeedback('')
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [copyFeedback])

  const handleFormat = () => {
    try {
      const formatted = formatJson(input)
      setOutput(formatted)
      setError('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'JSONの解析に失敗しました。'
      setError(`JSONの解析に失敗しました: ${message}`)
      setOutput('')
    }
  }

  const handleMinify = () => {
    try {
      const minified = minifyJson(input)
      setOutput(minified)
      setError('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'JSONの解析に失敗しました。'
      setError(`JSONの解析に失敗しました: ${message}`)
      setOutput('')
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
        <h1>JSON Formatter</h1>
        <p>JSONを整形・圧縮できます。</p>
      </header>

      <section className="tool-panel" aria-label="JSON Formatter">
        <div className="formatter-grid">
          <label className="field-label" htmlFor="json-input">
            Input
          </label>
          <textarea
            id="json-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="JSONを入力してください"
            rows={12}
          />

          <div className="action-row">
            <button type="button" onClick={handleFormat}>
              Format
            </button>
            <button type="button" onClick={handleMinify}>
              Minify
            </button>
            <button type="button" className="secondary" onClick={handleClear}>
              Clear
            </button>
            <button type="button" className="secondary" onClick={handleCopy} disabled={!hasOutput}>
              Copy
            </button>
          </div>

          <label className="field-label" htmlFor="json-output">
            Output
          </label>
          <textarea
            id="json-output"
            value={output}
            readOnly
            placeholder="整形されたJSONがここに表示されます"
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
        <h2>JSON Formatterとは</h2>
        <p>
          JSON Formatterは、JSONデータを読みやすい形式へ整形したり、不要な空白を削除して圧縮したりするためのツールです。
        </p>
      </section>

      <section className="tool-info">
        <h2>使い方</h2>
        <ol>
          <li>JSONを入力</li>
          <li>Formatで整形</li>
          <li>Minifyで圧縮</li>
          <li>Copyで結果をコピー</li>
          <li>Clearで内容を初期化</li>
        </ol>
      </section>

      <section className="tool-info">
        <h2>Privacy Information</h2>
        <p>このツールの処理はすべてブラウザ上で実行されます。入力したデータはサーバーへ送信されません。</p>
      </section>
    </div>
  )
}
