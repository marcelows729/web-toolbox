import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToolResult } from '../../components/tools/useToolResult'
import { normalizeReplaceLines, replaceLiteral, validateReplaceField } from './replace'
import type { ReplaceField } from './replace'
const initial = () => ({ input: '', search: '', replacement: '' })
const fields = [{ id: 'input', label: '元の本文', rows: 7 }, { id: 'search', label: '検索文字列', rows: 3 }, { id: 'replacement', label: '置換文字列', rows: 3 }] as const
export default function TextReplace() {
  const [values, setValues] = useState(initial)
  const [count, setCount] = useState<number | null>(null)
  const [inputError, setInputError] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const result = useToolResult()
  const clearResult = () => { setCount(null); result.reset() }
  const accept = (field: ReplaceField, value: string) => {
    clearResult()
    try { validateReplaceField(field, value); setValues(current => ({ ...current, [field]: normalizeReplaceLines(value) })); setInputError(''); return true }
    catch (cause) { setInputError(`${(cause as Error).message} 元の入力は保持しています。`); return false }
  }
  const error = inputError || result.error
  return <div className="container tool-page text-formatter text-replace"><header className="tool-header"><h1>文字列の一括置換</h1><p>本文中の同じ文字列を、別の文字列へまとめて置き換えます。</p></header>
    <section className="tool-panel" aria-label="文字列の一括置換">
      {fields.map(field => <div className="text-replace-field" key={field.id}><label className="field-label" htmlFor={`text-replace-${field.id}`}>{field.label}</label><textarea ref={field.id === 'input' ? inputRef : undefined} id={`text-replace-${field.id}`} rows={field.rows} spellCheck={false} value={values[field.id]} aria-describedby={`text-replace-help${error ? ' text-replace-error' : ''}`} onChange={event => accept(field.id, event.target.value)} onPaste={event => {
        event.preventDefault()
        const pasted = event.clipboardData.getData('text/plain'), start = event.currentTarget.selectionStart, end = event.currentTarget.selectionEnd
        const next = values[field.id].slice(0, start) + pasted + values[field.id].slice(end)
        if (accept(field.id, next)) { const element = event.currentTarget; requestAnimationFrame(() => { const cursor = start + normalizeReplaceLines(pasted).length; element.setSelectionRange(cursor, cursor) }) }
      }} /></div>)}
      <p className="text-format-help" id="text-replace-help">検索は完全一致・正規表現なし。検索が空の場合は実行できません。置換文字列が空の場合は、一致する箇所を削除します。本文50,000・検索1,000・置換10,000・結果100,000文字相当までです。</p>
      <div className="action-row"><button id="text-replace-run" type="button" className="primary-button" disabled={!values.search || result.busy} onClick={() => { setInputError(''); setCount(null); void result.run(() => { const next = replaceLiteral(values.input, values.search, values.replacement); setCount(next.count); return next.output }) }}>一括置換する</button><button id="text-replace-copy" type="button" className="secondary-button" disabled={result.output === null || result.busy} onClick={() => void result.copy()}>結果をコピー</button><button id="text-replace-clear" type="button" className="secondary-button" onClick={() => { setValues(initial()); setInputError(''); clearResult(); inputRef.current?.focus() }}>クリア</button></div>
      {error && <p id="text-replace-error" className="error-box" role="alert">{error}</p>}
      <p className="text-format-status" role="status" aria-live="polite">{result.output !== null && count !== null ? `置換した箇所：${count.toLocaleString('ja-JP')}件${result.feedback ? `。${result.feedback}` : ''}` : result.feedback}</p>
      <label className="field-label" htmlFor="text-replace-output">置換した本文</label><textarea id="text-replace-output" rows={7} spellCheck={false} readOnly value={result.output ?? ''} />
    </section>
    <section className="tool-info"><h2>使い方と置換の範囲</h2><p>本文・検索文字列・置換文字列を入力し「一括置換する」を押します。カンマ「,」を「','」へ置換するような記号の処理にも使えます。置換が空なら削除、検索に一致する箇所がなければ0件で本文をそのまま返します。空の本文も扱えます。</p><p>左から重ならない一致をすべて置換します。「ababa」で「aba」を「X」にすると「Xba」です。「a」を「aa」にしても、生成した「aa」を再び置換しません。「$&」などもそのままの文字列として挿入します。</p><p>大小文字や半角・全角、Unicodeの正規化は同一視しません。日本語・絵文字・結合文字・HTMLも文字列として扱います。例えば「é」と「e＋結合アクセント」は別の文字列です。検索・置換には改行も入力できます。貼り付けたCRLF・CRは、本文・検索・置換のすべてでLFに統一し、コピーする結果もLFです。</p><p>元の本文へ結果を上書きしません。入力を編集すると結果とコピー通知が消えるため、再実行してください。上限はUTF-16単位で数えるため、絵文字などは複数文字相当になります。上限を超える入力は切り捨てずに拒否し、結果の増幅も生成前に確認します。</p></section>
    <section className="tool-info"><h2>入力データについて</h2><p>本文・検索・置換・結果は画面内だけで扱い、保存・送信・URLへの埋め込みはしません。画面を離れると消えます。操作したときだけ結果をクリップボードへコピーします。お気に入りと最近使用に保存するのはツールIDだけです。</p></section>
    <section className="tool-info"><h2>関連ツール</h2><div className="calculation-related"><Link to="/tools/text-formatter">テキスト整形</Link><Link to="/tools/character-counter">文字数カウンター</Link><Link to="/tools/text-diff">Text Diff</Link></div></section>
  </div>
}
