import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// 入力変更、Clear、画面離脱後に古い計算・コピーの通知を反映しない。
export function useToolResult() {
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const revision = useRef(0)

  useEffect(() => () => { revision.current += 1 }, [])

  const reset = () => {
    revision.current += 1
    setOutput(null)
    setError('')
    setFeedback('')
    setBusy(false)
  }

  const run = async (calculate: () => string | Promise<string>) => {
    const current = ++revision.current
    setOutput(null)
    setError('')
    setFeedback('')
    setBusy(true)
    try {
      const value = await calculate()
      if (current === revision.current) setOutput(value)
    } catch (cause) {
      if (current === revision.current) {
        setError(cause instanceof Error ? cause.message : '処理に失敗しました。')
      }
    } finally {
      if (current === revision.current) setBusy(false)
    }
  }

  const copy = async () => {
    if (output === null) return
    const current = revision.current
    setFeedback('')
    setError('')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(output)
      if (current === revision.current) setFeedback('コピーしました')
    } catch {
      if (current === revision.current) {
        setError('コピーできませんでした。出力欄を選択して手動でコピーしてください。')
      }
    }
  }

  return { output, error, feedback, busy, reset, run, copy }
}

type Props = {
  title: string
  description: string
  usage: ReactNode
  children: ReactNode
  result: ReturnType<typeof useToolResult>
  onClear: () => void
}

export default function BrowserTool({ title, description, usage, children, result, onClear }: Props) {
  const outputId = useId()
  return (
    <div className="container tool-page">
      <header className="tool-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <section className="tool-panel" aria-label={title}>
        <div className="formatter-grid">
          {children}
          <div className="action-row">
            <button type="button" className="secondary-button" onClick={onClear}>Clear</button>
            <button type="button" className="secondary-button" onClick={() => void result.copy()} disabled={result.output === null || result.busy}>Copy</button>
          </div>
          <label className="field-label" htmlFor={outputId}>Output</label>
          <textarea id={outputId} value={result.output ?? ''} readOnly rows={8} spellCheck={false} />
        </div>
        {result.error && <div className="error-box" role="alert">{result.error}</div>}
        <div role="status" aria-live="polite">
          {result.busy ? <p>処理中…</p> : result.output !== null ? <p>処理が完了しました。</p> : null}
          {result.feedback && <p className="copy-feedback">{result.feedback}</p>}
        </div>
      </section>
      <section className="tool-info">
        <h2>使い方・計算仕様</h2>
        {usage}
        <p>入力と設定を選び、実行ボタンを押してください。Copyで出力全体をコピーし、Clearで入力・設定・結果・エラーを初期化します。入力変更後は再実行してください。</p>
      </section>
      <section className="tool-info">
        <h2>Privacy Information</h2>
        <p>このツールの処理はすべてブラウザ上で実行されます。入力したデータはサーバーへ送信されず、永続保存されません。Copyを押した場合だけ結果をクリップボードへ書き込みます。</p>
      </section>
    </div>
  )
}
