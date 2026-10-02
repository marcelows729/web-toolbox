import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToolResult } from '../../components/tools/useToolResult'
import { textCounts } from '../character-counter/count'
import { applyDisplayedEdit, defaultTextOptions, formatText, MAX_TEXT_UNITS, rawTextOffset, TEXT_OPERATIONS, validateTextInput } from './format'
import type { TextFormatting } from './format'

export default function TextFormatter() {
  const [input, setInput] = useState('')
  const [options, setOptions] = useState(defaultTextOptions)
  const [formatted, setFormatted] = useState<TextFormatting | null>(null)
  const [inputError, setInputError] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const result = useToolResult()
  const before = useMemo(() => textCounts(input), [input])
  const clearResult = () => { setFormatted(null); result.reset() }
  const accept = (next: string, pasted = false) => {
    clearResult()
    try { validateTextInput(next); setInput(next); setInputError(''); return true }
    catch (cause) { setInputError(`${(cause as Error).message} ${pasted ? '貼り付けませんでした。' : '変更は反映していません。'}元の入力は保持しています。`); return false }
  }
  const reset = () => { setInput(''); setOptions(defaultTextOptions()); setInputError(''); clearResult(); inputRef.current?.focus() }
  return <div className="container tool-page text-formatter"><header className="tool-header"><h1>テキスト整形</h1><p>文章や一覧の空白・空行・重複を、選んだ操作だけで整えます。</p></header>
    <section className="tool-panel" aria-label="テキスト整形">
      <label className="field-label" htmlFor="text-format-input">元のテキスト</label>
      <textarea ref={inputRef} id="text-format-input" rows={9} value={input} spellCheck={false} aria-describedby="text-format-limit" aria-invalid={inputError ? true : undefined} onChange={event => { const displayed = event.target.value; if (displayed.length > MAX_TEXT_UNITS) accept(displayed); else accept(applyDisplayedEdit(input, displayed)) }} onPaste={event => {
        event.preventDefault()
        const pasted = event.clipboardData.getData('text/plain')
        if (pasted.length > MAX_TEXT_UNITS) { accept(pasted, true); return }
        const start = event.currentTarget.selectionStart
        const end = event.currentTarget.selectionEnd
        const next = input.slice(0, rawTextOffset(input, start)) + pasted + input.slice(rawTextOffset(input, end))
        if (accept(next, true)) requestAnimationFrame(() => { const cursor = start + pasted.replace(/\r\n|\r/g, '\n').length; inputRef.current?.setSelectionRange(cursor, cursor) })
      }} placeholder="ここに整えたいテキストを貼り付けてください。" />
      <p className="text-format-help" id="text-format-limit">上限は50,000文字相当・5,000行です。超える入力は切り捨てずに受け付けません。</p>
      <fieldset className="text-format-options"><legend>適用する操作</legend>{TEXT_OPERATIONS.map(operation => <label className="text-format-option" key={operation.id}><input id={`text-format-${operation.id}`} type="checkbox" checked={options[operation.id]} onChange={event => { setOptions(current => ({ ...current, [operation.id]: event.target.checked })); setInputError(''); clearResult() }} /><span><strong>{operation.label}</strong><small>{operation.detail}</small></span></label>)}</fieldset>
      <p className="text-format-help">処理順：前後空白 → 空行削除 → 空行集約 → 重複行除去 → 改行を空白に。選んだ操作だけを、この順に適用します。</p>
      <div className="action-row"><button id="text-format-run" type="button" className="primary-button" disabled={result.busy} onClick={() => { setInputError(''); void result.run(() => { const next = formatText(input, options); setFormatted(next); return next.output }) }}>整形する</button><button id="text-format-copy" type="button" className="secondary-button" disabled={result.output === null || result.busy} onClick={() => void result.copy()}>結果をコピー</button><button id="text-format-reset" type="button" className="secondary-button" onClick={reset}>リセット</button></div>
      {(inputError || result.error) && <p className="error-box" role="alert">{inputError || result.error}</p>}
      <p className="text-format-status" role="status" aria-live="polite">{result.feedback || (formatted ? `整形しました。${formatted.after.lines}行、${formatted.after.characters}文字です。` : '')}</p>
      <dl className="text-format-counts"><div><dt>元のテキスト</dt><dd><span id="text-format-before-lines">{before.lines}</span> 行 / <span id="text-format-before-characters">{before.characters}</span> 文字</dd></div><div><dt>整形後</dt><dd>{formatted ? <><span id="text-format-after-lines">{formatted.after.lines}</span> 行 / <span id="text-format-after-characters">{formatted.after.characters}</span> 文字</> : '未実行'}</dd></div></dl>
      <label className="field-label" htmlFor="text-format-output">整形したテキスト</label><textarea id="text-format-output" value={result.output ?? ''} readOnly rows={9} spellCheck={false} placeholder="整形するボタンを押すと、結果をここに表示します。" />
    </section>
    <section className="tool-info"><h2>使い方と処理の範囲</h2><p>テキストを入力し、必要な操作を選んで「整形する」を押します。すべての操作は最初はOFFです。何も選ばなければ入力をそのまま結果にします。元の入力は上書きしません。入力や選択を変えると結果・コピー通知は消えるため、もう一度整形してください。</p><p>CRLF・LF・CRをそれぞれ1つの改行として扱います。改行の置換を選ばない場合は、残った行の区切りを維持します。末尾の改行は空の最終行として扱い、空行削除や重複除去などの選択によって消える場合があります。空行だけの入力を削除・集約すると空文字になる場合があります。空白への置換は末尾の改行も空白にし、空白を自動で詰めません。</p><p>空白・タブだけの行も空行とみなします。重複は、その前の操作を適用した行の文字列の完全一致で判定します。大小文字の変換やUnicode正規化は行いません。絵文字・結合文字・HTMLのような文字列も、そのまま文字として扱います。</p><p>文字数は文字数カウンターと同じく、改行・空白を含む見た目の文字単位で数えます。見た目の文字単位に対応しないブラウザではUnicodeコードポイント単位に切り替わり、絵文字・結合文字が複数文字になる場合があります。空文字は0行・0文字、末尾の改行は行数を1増やします。入力上限はUTF-16単位で計算するため、絵文字などは表示文字数より多く数える場合があります。</p></section>
    <section className="tool-info"><h2>入力データについて</h2><p>入力と結果は画面内だけで扱い、保存・送信・URLへの埋め込みはしません。画面を離れると消えます。コピーしたときだけ結果をクリップボードに書き込みます。お気に入りと最近使用に保存するのはツールIDだけです。</p></section>
    <section className="tool-info"><h2>関連ツール</h2><div className="calculation-related"><Link to="/tools/character-counter">文字数カウンター</Link><Link to="/tools/text-diff">Text Diff</Link><Link to="/tools/html-escape">HTMLエスケープ・解除</Link></div></section>
  </div>
}
