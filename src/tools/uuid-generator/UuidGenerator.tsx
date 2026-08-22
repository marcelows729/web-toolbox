import { useMemo, useState } from 'react'

type CaseMode = 'lower' | 'upper'

const formatUuid = (uuid: string, mode: CaseMode) => (mode === 'upper' ? uuid.toUpperCase() : uuid.toLowerCase())

const validateCount = (value: string) => {
  const trimmed = value.trim()

  if (trimmed === '') {
    return '生成件数を入力してください。'
  }

  if (!/^\d+$/.test(trimmed)) {
    return '生成件数は1〜100の整数で入力してください。'
  }

  const parsed = Number(trimmed)

  if (!Number.isInteger(parsed)) {
    return '生成件数は整数で入力してください。'
  }

  if (parsed < 1 || parsed > 100) {
    return '生成件数は1〜100の範囲で入力してください。'
  }

  return parsed
}

export default function UuidGenerator() {
  const [countInput, setCountInput] = useState('1')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [caseMode, setCaseMode] = useState<CaseMode>('lower')

  const hasOutput = useMemo(() => output.trim().length > 0, [output])

  const handleGenerate = () => {
    const validationResult = validateCount(countInput)

    if (typeof validationResult === 'string') {
      setOutput('')
      setError(validationResult)
      return
    }

    try {
      if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
        throw new Error('crypto.randomUUID is not available')
      }

      const uuids = Array.from({ length: validationResult }, () => formatUuid(crypto.randomUUID(), caseMode))
      setOutput(uuids.join('\n'))
      setError('')
    } catch {
      setOutput('')
      setError('UUIDを生成できませんでした。ブラウザの対応状況をご確認ください。')
    }
  }

  const handleCaseChange = (nextMode: CaseMode) => {
    if (!output) {
      setCaseMode(nextMode)
      return
    }

    const updatedOutput = output
      .split(/\n/)
      .filter((line) => line.length > 0)
      .map((uuid) => formatUuid(uuid, nextMode))
      .join('\n')

    setCaseMode(nextMode)
    setOutput(updatedOutput)
  }

  const handleClear = () => {
    setCountInput('1')
    setOutput('')
    setError('')
    setCopyFeedback('')
    setCaseMode('lower')
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
        <h1>UUID Generator</h1>
        <p>UUID v4をブラウザ上で生成します。</p>
      </header>

      <section className="tool-panel" aria-label="UUID Generator">
        <div className="generator-grid">
          <label className="field-label" htmlFor="uuid-count-input">
            生成件数
          </label>
          <input
            id="uuid-count-input"
            type="number"
            min={1}
            max={100}
            step={1}
            value={countInput}
            onChange={(event) => setCountInput(event.target.value)}
            aria-describedby="uuid-count-help"
          />

          <div className="generator-controls">
            <div className="option-group">
              <span className="option-label">大文字 / 小文字</span>
              <div className="toggle-group" role="radiogroup" aria-label="UUIDの表示形式">
                <button
                  type="button"
                  className={`toggle-option ${caseMode === 'lower' ? 'is-selected' : ''}`}
                  onClick={() => handleCaseChange('lower')}
                  aria-pressed={caseMode === 'lower'}
                >
                  小文字
                </button>
                <button
                  type="button"
                  className={`toggle-option ${caseMode === 'upper' ? 'is-selected' : ''}`}
                  onClick={() => handleCaseChange('upper')}
                  aria-pressed={caseMode === 'upper'}
                >
                  大文字
                </button>
              </div>
            </div>
          </div>

          <div className="action-row">
            <button type="button" className="primary-button" onClick={handleGenerate}>Generate</button>
            <button type="button" className="secondary-button" onClick={handleClear}>Clear</button>
            <button type="button" className="secondary-button" onClick={handleCopy} disabled={!hasOutput}>Copy</button>
          </div>

          <label className="field-label" htmlFor="uuid-output">
            Output
          </label>
          <textarea
            id="uuid-output"
            value={output}
            readOnly
            placeholder="生成されたUUIDが1行ずつ表示されます。"
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
        <h2>UUID Generatorとは</h2>
        <p>
          UUID Generatorは、UUID v4をブラウザ上で生成するツールです。
          1件から複数件までまとめて生成でき、API、データベース、テストデータなどで使用するUUIDの作成に利用できます。
        </p>
      </section>

      <section className="tool-info">
        <h2>UUIDについて</h2>
        <p>
          UUIDは、システム上でデータなどを一意に識別するために使用される識別子です。このツールではUUID v4を生成します。
        </p>
      </section>

      <section className="tool-info">
        <h2>使い方</h2>
        <ol>
          <li>生成するUUIDの件数を指定します。</li>
          <li>必要に応じて小文字 / 大文字を選択します。</li>
          <li>Generateを押します。</li>
          <li>必要に応じてCopyします。</li>
        </ol>
      </section>

      <section className="tool-info">
        <h2>Privacy Information</h2>
        <p>
          このツールの処理はすべてブラウザ上で実行されます。生成処理のためにデータがサーバーへ送信されることはありません。
        </p>
      </section>
    </div>
  )
}
