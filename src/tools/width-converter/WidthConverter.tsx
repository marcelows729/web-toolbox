import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToolResult } from '../../components/tools/useToolResult'
import { applyDisplayedEdit, rawTextOffset } from '../text-formatter/format'
import { convertWidth, defaultWidthTargets, MAX_WIDTH_UNITS, validateWidthInput, WIDTH_TARGETS } from './width'
import type { WidthDirection } from './width'
export default function WidthConverter() {
  const [input, setInput] = useState('')
  const [direction, setDirection] = useState<WidthDirection>('half')
  const [targets, setTargets] = useState(defaultWidthTargets)
  const [changed, setChanged] = useState<number | null>(null)
  const [inputError, setInputError] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const result = useToolResult()
  const clearResult = () => { setChanged(null); result.reset() }
  const accept = (value: string) => { clearResult(); try { validateWidthInput(value); setInput(value); setInputError(''); return true } catch(cause) { setInputError(`${(cause as Error).message} 元の入力は保持しています。`); return false } }
  const error = inputError || result.error
  return <div className="container tool-page text-formatter"><header className="tool-header"><h1>英数字の全角・半角変換</h1><p>文章中の英字・数字など、選んだ文字だけを全角または半角に揃えます。</p></header>
    <section className="tool-panel" aria-label="英数字の全角・半角変換">
      <label className="field-label" htmlFor="width-input">元のテキスト</label><textarea ref={inputRef} id="width-input" value={input} rows={8} spellCheck={false} aria-describedby={`width-help${error ? ' width-error' : ''}`} onChange={event => accept(event.target.value.length > MAX_WIDTH_UNITS ? event.target.value : applyDisplayedEdit(input, event.target.value))} onPaste={event => {
        event.preventDefault()
        const text = event.clipboardData.getData('text/plain'), start = event.currentTarget.selectionStart, end = event.currentTarget.selectionEnd
        if (text.length > MAX_WIDTH_UNITS) { accept(text); return }
        const next = input.slice(0, rawTextOffset(input, start)) + text + input.slice(rawTextOffset(input, end))
        if (accept(next)) { const element = event.currentTarget; requestAnimationFrame(() => element.setSelectionRange(start + text.replace(/\r\n|\r/g,'\n').length, start + text.replace(/\r\n|\r/g,'\n').length)) }
      }} />
      <p id="width-help" className="text-format-help">既定は英字と数字だけを変換します。日本語・絵文字・タブ・改行は保持します。入力・結果は50,000文字相当（UTF-16単位）まで。</p>
      <div className="toggle-group" role="group" aria-label="変換方向">{(['half','full'] as const).map(value => <button id={`width-${value}`} key={value} type="button" className={`toggle-option ${direction === value ? 'is-selected' : ''}`} aria-pressed={direction === value} onClick={() => { setDirection(value); setInputError(''); clearResult() }}>{value === 'half' ? '半角へ' : '全角へ'}</button>)}</div>
      <fieldset className="text-format-options"><legend>変換する対象</legend>{WIDTH_TARGETS.map(({id,label,detail}) => <label className="text-format-option" htmlFor={`width-${id}`} key={id}><input id={`width-${id}`} type="checkbox" checked={targets[id]} onChange={event => { setTargets(current => ({ ...current, [id]: event.target.checked })); setInputError(''); clearResult() }} /><span><strong>{label}</strong><small>{detail}</small></span></label>)}</fieldset>
      <div className="action-row"><button id="width-run" type="button" className="primary-button" disabled={result.busy} onClick={() => { setInputError(''); setChanged(null); void result.run(() => { const next = convertWidth(input,direction,targets); setChanged(next.changed); return next.output }) }}>変換する</button><button id="width-copy" type="button" className="secondary-button" disabled={result.output === null || result.busy} onClick={() => void result.copy()}>結果をコピー</button><button id="width-reset" type="button" className="secondary-button" onClick={() => { setInput(''); setDirection('half'); setTargets(defaultWidthTargets()); setInputError(''); clearResult(); inputRef.current?.focus() }}>リセット</button></div>
      {error && <p className="error-box" id="width-error" role="alert">{error}</p>}
      <p className="text-format-status" role="status" aria-live="polite">{result.output !== null && changed !== null ? `変更した文字：${changed.toLocaleString('ja-JP')}文字${result.feedback ? `。${result.feedback}` : ''}` : result.feedback}</p>
      <label className="field-label" htmlFor="width-output">変換したテキスト</label><textarea id="width-output" readOnly value={result.output ?? ''} rows={8} spellCheck={false} />
    </section>
    <section className="tool-info"><h2>変換の範囲</h2><p>英字・数字・ASCII記号は、半角のU+0021〜U+007Eと対応する全角のU+FF01〜U+FF5Eだけを変換します。スペースは半角U+0020と全角U+3000です。英字の大小は変えません。対象をすべて外すと入力をそのまま結果にします。変更数は実際に変換した文字数で、絵文字などの見た目の文字数とは別です。</p><p>ひらがな・カタカナ（半角カナも含む）・漢字・絵文字・濁点・丸数字・ローマ数字・㎏や℃などの記号は対象外です。数字や記号を含むキーキャップ絵文字（1️⃣など）も保持します。Unicodeの一括正規化（NFKC）は行いません。</p><p>全角チルダ「～」（U+FF5E）はASCIIの「~」に対応しますが、波ダッシュ「〜」（U+301C）は別文字なので保持します。円記号「¥」「￥」も対象外です。ASCIIの逆斜線「\」は全角の「＼」と対応し、円記号とは区別します。</p><p>元の本文に結果を上書きしません。入力・方向・対象を変えると結果とコピー通知が消えます。貼り付けたCRLF・CR・LFやタブは内部とコピー処理で保持し、入力欄ではブラウザの仕様で改行がLFに見えます。クリップボード側の改行形式は環境で変わる場合があります。</p><p>入出力は50,000 UTF-16単位まで。絵文字などは複数単位になります。上限超過は切り捨てずに拒否し、元の入力を保持します。対応表の1文字を1文字へ置き換えるため、出力の増幅はありません。</p></section>
    <section className="tool-info"><h2>入力データについて</h2><p>入力・設定・結果は画面内だけで扱い、保存・送信・URLへの埋め込みはしません。画面を離れると消えます。操作したときだけ結果をクリップボードへコピーします。お気に入り・最近使用にはツールIDだけを記録します。</p></section>
    <section className="tool-info"><h2>関連ツール</h2><div className="calculation-related"><Link to="/tools/text-formatter">テキスト整形</Link><Link to="/tools/text-replace">文字列の一括置換</Link><Link to="/tools/character-counter">文字数カウンター</Link></div></section>
  </div>
}
