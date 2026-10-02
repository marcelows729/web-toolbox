import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToolResult } from '../../components/tools/useToolResult'
import { createGroups, groupingSummary, MAX_INPUT_UNITS, parseParticipants } from './grouping'
import type { GroupingResult } from './grouping'
export default function RandomGrouping() {
  const [input, setInput] = useState('')
  const [count, setCount] = useState('2')
  const [grouped, setGrouped] = useState<GroupingResult | null>(null)
  const [inputError, setInputError] = useState('')
  const [round, setRound] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const result = useToolResult()
  const parsed = useMemo(() => { try { return parseParticipants(input) } catch { return null } }, [input])
  const clear = () => { setGrouped(null); setRound(0); setInputError(''); result.reset() }
  const accept = (next: string) => {
    clear()
    if (next.length > MAX_INPUT_UNITS) { setInputError('入力全体は30,000文字相当までです。変更は反映せず、元の入力を保持しています。'); return }
    setInput(next)
  }
  const reset = () => { setInput(''); setCount('2'); clear(); inputRef.current?.focus() }
  const error = inputError || result.error
  return <div className="container tool-page random-grouping">
    <header className="tool-header"><h1>ランダム組み分け</h1><p>イベントやゲームの候補全員を、人数差1以内の組に分けます。</p></header>
    <section className="tool-panel" aria-label="ランダム組み分け">
      <form onSubmit={event => { event.preventDefault(); setInputError(''); setGrouped(null); void result.run(() => { const next = createGroups(input, count); setGrouped(next); setRound(previous => previous + 1); return groupingSummary(next) }) }}>
        <label className="field-label" htmlFor="grouping-candidates">候補（1行に1人・1件）</label>
        <textarea ref={inputRef} id="grouping-candidates" rows={8} value={input} spellCheck={false} aria-describedby={'grouping-help' + (parsed?.duplicateNames.length ? ' grouping-duplicates' : '') + (error ? ' grouping-error' : '')} onChange={event => accept(event.target.value)} placeholder={'りん\nゆう\nそら\nあお'} />
        <p className="calculation-help" id="grouping-help">2〜100候補、1候補100文字まで。空行を除き、行の前後の空白を取り除きます。候補番号は空行を除いた入力順です。</p>
        <p className="grouping-count">{parsed ? parsed.participants.length + '候補' : '候補を入力してください。'}</p>
        {parsed && parsed.duplicateNames.length > 0 && <p className="grouping-duplicate-note" id="grouping-duplicates" role="status">同名の候補が含まれています。削除・統合せず、候補番号で区別してすべて組に入れます。</p>}
        <label className="field-label grouping-count-field" htmlFor="grouping-count">組数（2〜候補数）<input id="grouping-count" type="text" inputMode="numeric" value={count} onChange={event => { setCount(event.target.value); clear() }} aria-describedby={error ? 'grouping-error' : undefined} /></label>
        <div className="action-row"><button id="grouping-draw" type="submit" className="primary-button" disabled={result.busy}>{grouped ? 'もう一度組み分け' : '組み分けする'}</button><button id="grouping-copy" type="button" className="secondary-button" disabled={result.output === null || result.busy} onClick={() => void result.copy()}>結果をコピー</button><button id="grouping-reset" type="button" className="secondary-button" onClick={reset}>リセット</button></div>
      </form>
      {error && <p id="grouping-error" className="error-box" role="alert">{error}</p>}
      <p className="grouping-status" role="status" aria-live="polite">{result.busy ? '組み分けしています…' : result.feedback || (grouped ? round + '回目：' + grouped.total + '候補を' + grouped.groups.length + '組に分けました。' : '')}</p>
      {grouped && <section className="grouping-result" aria-labelledby="grouping-result-title"><h2 id="grouping-result-title">組み分け結果</h2><div className="grouping-results">{grouped.groups.map((group, index) => <article className="grouping-group" key={index}><h3>組{index + 1}（{group.length}候補）</h3><ul className="grouping-members">{group.map(person => <li key={person.id} data-candidate-id={person.id}><span className="grouping-member-number">候補{person.id}</span><span>{person.name}</span></li>)}</ul></article>)}</div></section>}
      {result.output !== null && <details className="calculation-copy-details"><summary>コピー用のテキスト</summary><label className="visually-hidden" htmlFor="grouping-output">組み分け結果のテキスト</label><textarea id="grouping-output" value={result.output} readOnly rows={10} /></details>}
    </section>
    <section className="tool-info"><h2>使い方と組み分けの範囲</h2><p>候補全員と組数を入力し、「組み分けする」を押してください。全員をシャッフルして、各組の人数差が最大1になるように分けます。「もう一度組み分け」で新しい結果を作れます。同じ結果になる場合もあります。</p><p>組数は2〜候補数の整数で、全角数字も使えます。候補は100件まで、1候補100文字まで、入力全体は30,000文字相当まで。絵文字などは上限の計算では複数文字と数える場合があります。行前後の空白と空行だけを除き、名前の表記は変えません。同名も別の候補として扱います。</p><p>調整するのは人数だけです。能力や相性などによる組み合わせの調整は行いません。入力や組数を変更すると前の結果と通知は消えます。</p></section>
    <section className="tool-info"><h2>入力データについて</h2><p>入力と結果はこの画面内だけで扱い、保存・送信・URLへの埋め込みはしません。画面を離れると消えます。コピーしたときだけ結果をクリップボードへ書き込みます。お気に入りと最近使用に記録するのはツールIDだけです。</p></section>
    <section className="tool-info"><h2>関連ツール</h2><div className="calculation-related"><Link to="/tools/roulette-picker">ルーレット抽選</Link></div></section>
  </div>
}
