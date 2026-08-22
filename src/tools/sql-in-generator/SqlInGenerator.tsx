import { useEffect, useMemo, useState } from 'react'

type QuoteMode = 'string' | 'number'

const normalizeInput = (value: string): string[] =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

const escapeSqlString = (value: string) => value.replace(/'/g, "''")

const isValidSqlNumberLiteral = (value: string) => /^[-+]?(?:\d+\.\d+|\d+|\.\d+)$/.test(value)

const buildSqlInList = (input: string, quoteMode: QuoteMode, removeDuplicates: boolean) => {
  const normalizedValues = normalizeInput(input)

  if (normalizedValues.length === 0) {
    return {
      output: '',
      error: '入力値がありません。値を入力してください。',
    }
  }

  const values = removeDuplicates ? Array.from(new Set(normalizedValues)) : normalizedValues

  if (quoteMode === 'number') {
    const invalidValues = values.filter((value) => !isValidSqlNumberLiteral(value))

    if (invalidValues.length > 0) {
      return {
        output: '',
        error: `数値として扱えない値があります: ${invalidValues.join(', ')}`,
      }
    }

    return {
      output: `(${values.join(', ')})`,
      error: '',
    }
  }

  return {
    output: `(${values.map((value) => `'${escapeSqlString(value)}'`).join(', ')})`,
    error: '',
  }
}

export default function SqlInGenerator() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [quoteMode, setQuoteMode] = useState<QuoteMode>('string')
  const [removeDuplicates, setRemoveDuplicates] = useState(true)

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

  const handleGenerate = () => {
    const result = buildSqlInList(input, quoteMode, removeDuplicates)
    setOutput(result.output)
    setError(result.error)
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
    setCopyFeedback('')
    setQuoteMode('string')
    setRemoveDuplicates(true)
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
        <h1>SQL IN Generator</h1>
        <p>値の一覧からSQLのIN句で利用できるリストを生成します。</p>
      </header>

      <section className="tool-panel" aria-label="SQL IN Generator">
        <div className="generator-grid">
          <label className="field-label" htmlFor="sql-in-input">
            Input
          </label>
          <textarea
            id="sql-in-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
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
                  onClick={() => setQuoteMode('string')}
                  aria-pressed={quoteMode === 'string'}
                >
                  文字列
                </button>
                <button
                  type="button"
                  className={`toggle-option ${quoteMode === 'number' ? 'is-selected' : ''}`}
                  onClick={() => setQuoteMode('number')}
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
                onChange={(event) => setRemoveDuplicates(event.target.checked)}
              />
              <span>重複を除外する</span>
            </label>
          </div>

          <div className="action-row">
            <button type="button" onClick={handleGenerate}>
              Generate
            </button>
            <button type="button" className="secondary" onClick={handleClear}>
              Clear
            </button>
            <button type="button" className="secondary" onClick={handleCopy} disabled={!hasOutput}>
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
        </div>

        {error && <div className="error-box" role="alert">{error}</div>}
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
