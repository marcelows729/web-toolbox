import { useState } from 'react'
import { useToolResult } from '../../components/tools/useToolResult'
import { buildSqlInList, type QuoteMode } from './conversion'

export default function SqlInGenerator() {
  const [input, setInput] = useState('')
  const result = useToolResult()
  const output = result.output ?? ''
  const error = result.error
  const copyFeedback = result.feedback
  const hasOutput = output.trim().length > 0
  const handleCopy = () => { if (hasOutput) void result.copy() }
  const [resultCount, setResultCount] = useState<number | null>(null)
  const [quoteMode, setQuoteMode] = useState<QuoteMode>('string')
  const [removeDuplicates, setRemoveDuplicates] = useState(true)
  const resetResult = () => { result.reset(); setResultCount(null) }
  const changeQuoteMode = (mode: QuoteMode) => {
    if (mode !== quoteMode) { setQuoteMode(mode); resetResult() }
  }
  const handleGenerate = () => {
    setResultCount(null)
    void result.run(() => {
      const generated = buildSqlInList(input, quoteMode, removeDuplicates)
      if (generated.error) throw new Error(generated.error)
      setResultCount(generated.count)
      return generated.output
    })
  }
  const handleClear = () => {
    setInput(''); resetResult(); setQuoteMode('string'); setRemoveDuplicates(true)
  }

  return (
    <div className="container tool-page">
      <header className="tool-header">
        <h1>SQL IN Generator</h1>
        <p>値の一覧からSQLのIN句で利用できるリストを生成します。</p>
      </header>

      <section className="tool-panel" aria-label="SQL IN Generator">
        <div className="generator-grid">
          <label className="field-label" htmlFor="sql-in-input">
            Input
          </label>
          <textarea aria-describedby={error ? 'sql-in-generator-error' : undefined}
            id="sql-in-input"
            value={input}
            onChange={(event) => { setInput(event.target.value); resetResult() }}
            placeholder="apple\nbanana\norange\nまたは apple,banana,orange"
            rows={12}
          />

          <div className="generator-controls">
            <div className="option-group">
              <span className="option-label">Quote Mode</span>
              <div className="toggle-group" role="radiogroup" aria-label="SQL値の種類">
                <button
                  type="button"
                  className={`toggle-option ${quoteMode === 'string' ? 'is-selected' : ''}`}
                  onClick={() => changeQuoteMode('string')}
                  aria-pressed={quoteMode === 'string'}
                >
                  文字列
                </button>
                <button
                  type="button"
                  className={`toggle-option ${quoteMode === 'number' ? 'is-selected' : ''}`}
                  onClick={() => changeQuoteMode('number')}
                  aria-pressed={quoteMode === 'number'}
                >
                  数値
                </button>
              </div>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={removeDuplicates}
                onChange={(event) => { setRemoveDuplicates(event.target.checked); resetResult() }}
              />
              <span>重複を除外する</span>
            </label>
          </div>

          <div className="action-row">
            <button type="button" className="primary-button" onClick={handleGenerate}>
              Generate
            </button>
            <button type="button" className="secondary-button" onClick={handleClear}>
              Clear
            </button>
            <button type="button" className="secondary-button" onClick={handleCopy} disabled={!hasOutput}>
              Copy
            </button>
          </div>

          <label className="field-label" htmlFor="sql-in-output">
            Output
          </label>
          <textarea
            id="sql-in-output"
            value={output}
            readOnly
            placeholder="生成された値リストがここに表示されます"
            rows={8}
          />
          {hasOutput && resultCount !== null && <span className="field-label-sm">件数: {resultCount}件</span>}
        </div>

        {error && <div className="error-box" role="alert" id="sql-in-generator-error">{error}</div>}
        {copyFeedback && (
          <div className="copy-feedback" role="status" aria-live="polite">
            {copyFeedback}
          </div>
        )}
      </section>

      <section className="tool-info">
        <h2>SQL IN Generatorとは</h2>
        <p>
          SQL IN Generatorは、複数の値からSQLのIN句で利用できる値リストを生成するツールです。
          Excelやログなどからコピーした値を、改行またはカンマ区切りのまま貼り付けて利用できます。
        </p>
      </section>

      <section className="tool-info">
        <h2>使い方</h2>
        <ol>
          <li>値の一覧を入力します。</li>
          <li>文字列または数値を選択します。</li>
          <li>必要に応じて重複除去を設定します。</li>
          <li>Generateを押します。</li>
          <li>CopyでSQLへ貼り付けられる形式をコピーします。</li>
        </ol>
      </section>

      <section className="tool-info">
        <h2>Privacy Information</h2>
        <p>
          このツールの処理はすべてブラウザ上で実行されます。
          入力したデータはサーバーへ送信されません。
        </p>
      </section>
    </div>
  )
}
