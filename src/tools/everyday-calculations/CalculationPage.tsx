import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { useToolResult } from '../../components/tools/useToolResult'
import { tools } from '../registry'

export default function CalculationPage({ title, description, children, usage, related, result, onReset }: { title: string; description: string; children: ReactNode; usage: ReactNode; related: string[]; result: ReturnType<typeof useToolResult>; onReset: () => void }) {
  return <div className="container tool-page everyday-calculation"><header className="tool-header"><h1>{title}</h1><p>{description}</p></header>
    <section className="tool-panel" aria-label={title}>{children}
      {result.error && <p className="error-box" role="alert">{result.error}</p>}
      <div className="action-row calculation-actions"><button id="calculation-copy" type="button" className="secondary-button" disabled={result.output === null || result.busy} onClick={() => void result.copy()}>結果をコピー</button><button id="calculation-reset" type="button" className="secondary-button" onClick={onReset}>リセット</button></div>
      <p className="calculation-status" role="status" aria-live="polite">{result.busy ? '計算しています…' : result.feedback || (result.output !== null ? '計算しました。' : '')}</p>
      {result.output !== null && <details className="calculation-copy-details"><summary>コピー用のテキスト</summary><label className="visually-hidden" htmlFor="calculation-output">計算結果のテキスト</label><textarea id="calculation-output" value={result.output} readOnly rows={7} /></details>}
    </section>
    <section className="tool-info"><h2>使い方と計算の範囲</h2>{usage}<p>入力を変更すると前の結果は消えます。もう一度計算すると、新しい入力で結果を更新します。</p></section>
    <section className="tool-info"><h2>入力データについて</h2><p>入力と結果はこの画面内だけで扱い、保存・送信・URLへの埋め込みはしません。画面を離れると消えます。コピーしたときだけ結果をクリップボードに書き込みます。お気に入りと最近使用に記録するのはツールのIDだけです。</p></section>
    <section className="tool-info"><h2>関連ツール</h2><div className="calculation-related">{related.map(id => { const tool = tools.find(item => item.id === id); return tool && <Link key={id} to={tool.path}>{tool.name}</Link> })}</div></section>
  </div>
}
