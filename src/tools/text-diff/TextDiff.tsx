import { useEffect, useMemo, useState } from 'react'
import { diffLines, diffPrefix, opsToPlainText, splitLines, type DiffOp } from './diff'

export default function TextDiff() {
  const [textA, setTextA] = useState('')
  const [textB, setTextB] = useState('')
  const [diffResult, setDiffResult] = useState<DiffOp[] | null>(null)
  const [compareError, setCompareError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')

  const { addedCount, removedCount } = useMemo(() => {
    if (!diffResult) {
      return { addedCount: 0, removedCount: 0 }
    }

    return diffResult.reduce(
      (acc, op) => {
        if (op.type === 'add') {
          acc.addedCount += 1
        } else if (op.type === 'remove') {
          acc.removedCount += 1
        }
        return acc
      },
      { addedCount: 0, removedCount: 0 },
    )
  }, [diffResult])

  const isIdentical = diffResult !== null && addedCount === 0 && removedCount === 0
  const hasOutput = diffResult !== null

  useEffect(() => {
    if (!copyFeedback) {
      return
    }

    const timer = window.setTimeout(() => {
      setCopyFeedback('')
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [copyFeedback])

  const handleCompare = () => {
    try {
      const linesA = splitLines(textA)
      const linesB = splitLines(textB)
      const ops = diffLines(linesA, linesB)
      setDiffResult(ops)
      setCompareError('')
    } catch {
      setDiffResult(null)
      setCompareError('差分の計算に失敗しました。')
    }
  }

  const handleClear = () => {
    setTextA('')
    setTextB('')
    setDiffResult(null)
    setCompareError('')
    setCopyFeedback('')
  }

  const handleCopy = async () => {
    if (!diffResult) {
      return
    }

    try {
      await navigator.clipboard.writeText(opsToPlainText(diffResult))
      setCopyFeedback('コピーしました')
    } catch {
      setCopyFeedback('コピーに失敗しました')
    }
  }

  return (
    <div className="container tool-page">
      <header className="tool-header">
        <h1>Text Diff</h1>
        <p>2つのテキストの差分を確認します。</p>
      </header>

      <section className="tool-panel" aria-label="Text Diff">
        <div className="text-diff-input-grid">
          <div className="text-diff-field">
            <label className="field-label" htmlFor="text-diff-input-a">
              テキストA
            </label>
            <textarea
              id="text-diff-input-a"
              value={textA}
              onChange={(event) => setTextA(event.target.value)}
              placeholder="比較元のテキストを入力してください"
              rows={12}
            />
          </div>

          <div className="text-diff-field">
            <label className="field-label" htmlFor="text-diff-input-b">
              テキストB
            </label>
            <textarea
              id="text-diff-input-b"
              value={textB}
              onChange={(event) => setTextB(event.target.value)}
              placeholder="比較先のテキストを入力してください"
              rows={12}
            />
          </div>
        </div>

        <div className="action-row">
          <button type="button" className="primary-button" onClick={handleCompare}>
            Compare
          </button>
          <button type="button" className="secondary-button" onClick={handleClear}>
            Clear
          </button>
          <button type="button" className="secondary-button" onClick={handleCopy} disabled={!hasOutput}>
            Copy
          </button>
        </div>

        {compareError && (
          <div className="error-box" role="alert">
            {compareError}
          </div>
        )}

        {hasOutput && !compareError && (
          <div className="text-diff-output">
            <div className="text-diff-summary">
              <span className="text-diff-summary-added">+{addedCount}</span>
              {' / '}
              <span className="text-diff-summary-removed">-{removedCount}</span>
            </div>

            {isIdentical ? (
              <p className="text-diff-empty">2つのテキストは完全に一致しています。</p>
            ) : (
              <div className="text-diff-line-list" role="region" aria-label="差分結果">
                {diffResult?.map((op, index) => (
                  <div key={`${index}-${op.type}`} className={`text-diff-line text-diff-line--${op.type}`}>
                    <span className="text-diff-line-prefix" aria-hidden="true">
                      {diffPrefix(op.type)}
                    </span>
                    <span className="text-diff-line-text">{op.text.length > 0 ? op.text : ' '}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {copyFeedback && (
          <div className="copy-feedback" role="status" aria-live="polite">
            {copyFeedback}
          </div>
        )}
      </section>

      <section className="tool-info">
        <h2>Text Diffとは</h2>
        <p>
          Text Diffは、2つのテキストを行単位で比較し、追加された行・削除された行・変更のない行を色分けして表示するツールです。
          設定ファイルの差分確認や、文章の変更点の確認などに利用できます。
        </p>
      </section>

      <section className="tool-info">
        <h2>使い方</h2>
        <ol>
          <li>テキストAとテキストBにそれぞれ比較したいテキストを入力します。</li>
          <li>Compareを押すと、行単位の差分が表示されます。</li>
          <li>追加された行は「+」、削除された行は「-」のプレフィックスと背景色で区別されます。</li>
          <li>Copyで差分結果をプレフィックス付きのテキストとしてコピーできます。</li>
          <li>Clearで入力と結果をすべて初期化します。</li>
        </ol>
      </section>

      <section className="tool-info">
        <h2>Privacy Information</h2>
        <p>このツールの処理はすべてブラウザ上で実行されます。入力したデータはサーバーへ送信されません。</p>
      </section>
    </div>
  )
}
