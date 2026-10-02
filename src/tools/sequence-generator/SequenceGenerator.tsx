import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToolResult } from '../../components/tools/useToolResult'
import { generateSequence, initialSequence, validateSequenceField } from './sequence'
import type { SequenceField } from './sequence'
import './SequenceGenerator.css'
const fields: { key: SequenceField; label: string; placeholder?: string }[] = [
  { key: 'start', label: '開始番号' }, { key: 'count', label: '件数' }, { key: 'step', label: '増分' },
  { key: 'width', label: 'ゼロ埋めの桁数（任意）', placeholder: 'なし' },
  { key: 'prefix', label: '前につける文字（任意）', placeholder: '例：受付-' }, { key: 'suffix', label: '後につける文字（任意）', placeholder: '例：.jpg' },
]
export default function SequenceGenerator() {
  const [values, setValues] = useState(initialSequence)
  const [inputError, setInputError] = useState('')
  const first = useRef<HTMLInputElement>(null)
  const result = useToolResult()
  const accept = (field: SequenceField, value: string) => {
    result.reset()
    try { validateSequenceField(field, value); setValues(current => ({ ...current, [field]: value })); setInputError(''); return true }
    catch (cause) { setInputError((cause as Error).message + ' 直前の入力を保持しています。'); return false }
  }
  const error = inputError || result.error
  return <div className="container tool-page sequence-generator"><header className="tool-header"><h1>連番作成</h1><p>受付番号やファイル名に使える、番号・ラベルの一覧を作ります。</p></header>
    <section className="tool-panel" aria-label="連番の設定">
      <form onSubmit={event => { event.preventDefault(); if (!inputError) void result.run(() => generateSequence(values)) }}>
        <div className="sequence-fields">{fields.map(({ key, label, placeholder }) => <div key={key}><label className="field-label" htmlFor={'sequence-' + key}>{label}</label><input ref={key === 'start' ? first : undefined} id={'sequence-' + key} type="text" inputMode={key === 'count' || key === 'width' ? 'numeric' : 'text'} autoComplete="off" spellCheck={false} placeholder={placeholder} value={values[key]} aria-describedby={'sequence-help' + (error ? ' sequence-error' : '')} onChange={event => accept(key, event.target.value)} onPaste={event => {
          event.preventDefault(); const el = event.currentTarget, begin = el.selectionStart ?? 0, end = el.selectionEnd ?? begin, pasted = event.clipboardData.getData('text/plain')
          if (accept(key, values[key].slice(0, begin) + pasted + values[key].slice(end))) requestAnimationFrame(() => el.setSelectionRange(begin + pasted.length, begin + pasted.length))
        }} /></div>)}</div>
        <p id="sequence-help" className="text-format-help">件数は1〜10,000件。増分を負にすると降順、0にすると同じ番号になります。ゼロ埋めは符号を除く最低桁数です。</p>
        <div className="action-row"><button id="sequence-run" type="submit" className="primary-button" disabled={result.busy || !!inputError}>連番を作る</button><button id="sequence-copy" type="button" className="secondary-button" disabled={result.output === null || result.busy} onClick={() => void result.copy()}>結果をコピー</button><button id="sequence-clear" type="button" className="secondary-button" onClick={() => { setValues(initialSequence()); setInputError(''); result.reset(); first.current?.focus() }}>初期値に戻す</button></div>
      </form>
      {error && <p id="sequence-error" className="error-box" role="alert">{error}</p>}
      <p className="text-format-status" role="status" aria-live="polite">{result.feedback}</p>
      <label className="field-label" htmlFor="sequence-output">番号・ラベル一覧</label><textarea id="sequence-output" readOnly rows={8} spellCheck={false} value={result.output ?? ''} />
    </section>
    <section className="tool-info"><h2>使い方</h2><p>開始1・件数3・増分1・桁数3・前の文字「受付-」なら、受付-001から受付-003を1行ずつ作ります。前の文字「写真_」と後の文字「.jpg」でファイル名の一覧にも使えます。</p><p>整数と全角数字に対応します。開始・増分・結果の番号は正負18桁以内、ゼロ埋めは0〜20桁、前後文字は各100文字で改行なし、結果は100,000文字までです。文字数はUTF-16単位で数えます。入力を変えると結果を消します。ファイルそのものの名前は変更しません。</p></section>
    <section className="tool-info"><h2>入力データについて</h2><p>入力と結果はこの画面内だけで扱い、保存・送信・URLへの埋め込みはしません。コピーしたときだけ結果をクリップボードに書き込みます。お気に入りと最近使用にはツールIDだけを記録します。</p></section>
    <section className="tool-info"><h2>関連ツール</h2><div className="calculation-related"><Link to="/tools/text-formatter">テキスト整形</Link><Link to="/tools/sql-in-generator">SQL IN Generator</Link></div></section>
  </div>
}
