import { useId } from 'react'
import type { ReactNode } from 'react'
import { useToolResult } from './useToolResult'

type Props = {
  title: string
  description: string
  usage: ReactNode
  children: ReactNode
  result: ReturnType<typeof useToolResult>
  outputRows?: number
  onClear: () => void
}

export default function BrowserTool({ title, description, usage, children, result, onClear, outputRows = 8 }: Props) {
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
          <textarea id={outputId} value={result.output ?? ''} readOnly rows={outputRows} spellCheck={false} />
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
