import { useMemo, useRef, useState } from 'react'
import { useClipboardFeedback } from '../../components/tools/useClipboardFeedback'
import { counterSummary, normalizeCounterLines, validateCounterInput } from './summary'
export default function CharacterCounter() {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { feedback, reset: resetCopy, copy } = useClipboardFeedback()
  const summary = useMemo(() => counterSummary(input), [input])
  const accept = (next: string) => {
    resetCopy()
    try { validateCounterInput(next); setInput(normalizeCounterLines(next)); setError(''); return true }
    catch (cause) { setError(`${(cause as Error).message} 元の入力は保持しています。`); return false }
  }
  const stats = [['文字数', summary.totalCharacters], ['空白・改行除外', summary.withoutWhitespace], ['改行除外', summary.withoutNewlines], ['行数', summary.lines], ['単語数（空白区切り）', summary.words], ['UTF-8', `${summary.utf8Bytes} bytes`]]
  return <div className="container tool-page"><header className="tool-header"><h1>文字数カウンター</h1><p>文字数・空白や改行を除いた文字数・行数を、入力に合わせて確認します。</p></header>
    <section className="tool-panel" aria-label="文字数カウンター">
      <label className="field-label" htmlFor="character-counter-input">入力テキスト</label>
      <textarea ref={inputRef} id="character-counter-input" value={input} rows={12} spellCheck={false} placeholder="ここに文字数を数えたいテキストを入力してください。" aria-describedby={`counter-help${error ? ' counter-error' : ''}`} aria-invalid={error ? true : undefined} onChange={event => accept(event.target.value)} onPaste={event => {
        event.preventDefault()
        const pasted = event.clipboardData.getData('text/plain'), start = event.currentTarget.selectionStart, end = event.currentTarget.selectionEnd
        const next = input.slice(0, start) + pasted + input.slice(end)
        if (accept(next)) { const element = event.currentTarget; requestAnimationFrame(() => { const cursor = start + normalizeCounterLines(pasted).length; element.setSelectionRange(cursor, cursor) }) }
      }} />
      <p className="calculation-help" id="counter-help">文字数は原則、見た目の文字単位です。空白・改行除外は半角・全角スペース、タブ、改行などを除きます。改行除外はスペース・タブを残します。入力・貼り付けは50,000文字相当（UTF-16単位）まで。</p>
      {error && <p className="error-box" id="counter-error" role="alert">{error}</p>}
      <div className="action-row"><button id="counter-clear" type="button" className="secondary-button" onClick={() => { setInput(''); setError(''); resetCopy(); inputRef.current?.focus() }}>クリア</button><button id="counter-copy" type="button" className="secondary-button" disabled={!input.length} onClick={() => void copy(input, '入力テキストをコピーしました')}>入力をコピー</button></div>
      <div className="stats-grid">{stats.map(([label, count]) => <div className="stat-card" key={label}><span className="stat-label">{label}</span><strong>{count}</strong></div>)}</div>
      <div className="copy-feedback" role="status" aria-live="polite">{feedback}</div>
    </section>
    <section className="tool-info"><h2>数え方</h2><p>対応ブラウザでは、絵文字や結合文字を含む見た目の文字単位（書記素）で数えます。例えば家族の絵文字や「e＋結合アクセント」は1文字です。空白や改行も通常の文字数に含みます。文字分割に対応しないブラウザではUnicodeコードポイント単位へ切り替わり、家族の絵文字・結合文字が複数文字になる場合があります。大小文字の変更やUnicode正規化は行いません。</p><p>空白・改行除外、改行除外は、対象の文字を取り除いた文字列を数えます。除去後に隣接した結合文字などは、1文字としてまとまる場合があります。</p><p>この画面ではCRLF・CRをLFに統一して集計し、コピー処理にもその本文を渡します。クリップボード側でCRLFなどへ変わる場合があります。改行を1つとして数え、末尾の改行は行数を1増やします。空入力はすべて0です。単語数は空白で区切る数で、日本語の単語を自動分割しません。UTF-8は入力本文を符号化したバイト数です。</p><p>入力上限は見た目の文字数ではなくUTF-16単位で判定します。絵文字などは複数単位になる場合があります。超える入力・貼り付けは切り捨てずに拒否し、前の本文とその集計を保持します。入力を編集するとコピー通知が消えます。コピーするのは集計表ではなく入力本文です。</p></section>
    <section className="tool-info"><h2>入力データについて</h2><p>入力と集計はこの画面内だけで扱い、保存・送信・URLへの埋め込みはしません。画面を離れると消えます。入力をコピーしたときだけ本文をクリップボードへ書き込みます。お気に入りと最近使用に記録するのはツールIDだけです。</p></section>
  </div>
}
