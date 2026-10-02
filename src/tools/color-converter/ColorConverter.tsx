import { useRef, useState } from 'react'
import { useClipboardFeedback } from '../../components/tools/useClipboardFeedback'
import { convertColor } from './color'
import type { ColorFormat, ColorResult, ColorValues } from './color'

const initialValues = (): ColorValues => ({ hex: '', r: '', g: '', b: '', h: '', s: '', l: '' })
const labels = { hex: 'HEX', rgb: 'RGB', hsl: 'HSL' }
const rgbFields = [['r', 'R（赤）', '37'], ['g', 'G（緑）', '99'], ['b', 'B（青）', '235']] as const
const hslFields = [['h', 'H（度）', '221.2121'], ['s', 'S（%）', '83.1933'], ['l', 'L（%）', '53.3333']] as const

export default function ColorConverter() {
  const [format, setFormat] = useState<ColorFormat>('hex')
  const [values, setValues] = useState(initialValues)
  const [result, setResult] = useState<ColorResult | null>(null)
  const [error, setError] = useState('')
  const firstInput = useRef<HTMLInputElement>(null)
  const clipboard = useClipboardFeedback()
  const clearResult = () => { setResult(null); setError(''); clipboard.reset() }
  const update = (field: keyof ColorValues, value: string) => { setValues(current => ({ ...current, [field]: value })); clearResult() }
  const described = `color-help${error ? ' color-error' : ''}`
  const feedback = clipboard.feedback === 'コピーに失敗しました' ? 'コピーできませんでした。出力欄を選択して手動でコピーしてください。' : clipboard.feedback

  return <div className="container tool-page everyday-calculation color-converter">
    <header className="tool-header"><h1>カラーコード変換</h1><p>HEX・RGB・HSLを相互変換し、色見本を確認できます。</p></header>
    <section className="tool-panel" aria-label="カラーコード変換">
      <form onSubmit={event => { event.preventDefault(); clearResult(); try { setResult(convertColor(format, values)) } catch (cause) { setError(cause instanceof Error ? cause.message : '変換できませんでした。') } }}>
        <fieldset className="color-format"><legend>入力形式</legend><div className="toggle-group" role="group" aria-label="入力形式">{(Object.keys(labels) as ColorFormat[]).map(option => <button key={option} id={`color-format-${option}`} type="button" className={`toggle-option${format === option ? ' is-selected' : ''}`} aria-pressed={format === option} onClick={() => { setFormat(option); clearResult() }}>{labels[option]}</button>)}</div></fieldset>
        {format === 'hex' ? <label className="field-label" htmlFor="color-hex">HEX<input ref={firstInput} id="color-hex" type="text" value={values.hex} placeholder="#2563EB" maxLength={32} spellCheck={false} autoComplete="off" aria-describedby={described} aria-invalid={!!error} onChange={event => update('hex', event.target.value)} /></label> : <div className="color-fields">{(format === 'rgb' ? rgbFields : hslFields).map(([field, label, placeholder], index) => <label key={field} className="field-label" htmlFor={`color-${field}`}>{label}<input ref={index === 0 ? firstInput : undefined} id={`color-${field}`} type="text" inputMode={format === 'rgb' ? 'numeric' : 'decimal'} value={values[field]} placeholder={placeholder} maxLength={32} autoComplete="off" aria-describedby={described} aria-invalid={!!error} onChange={event => update(field, event.target.value)} /></label>)}</div>}
        <p className="calculation-help" id="color-help">{format === 'hex' ? '#と3桁または6桁の16進数（0〜9、A〜F）。' : format === 'rgb' ? 'R・G・Bはそれぞれ0〜255の整数。' : 'Hは−360,000〜360,000度、S・Lは0〜100。小数6桁まで。Hは360度で循環します。'} 全角英数字・記号と前後の空白も使えます。</p>
        <div className="action-row"><button id="color-convert" type="submit" className="primary-button">変換する</button><button id="color-reset" type="button" className="secondary-button" onClick={() => { setFormat('hex'); setValues(initialValues()); clearResult(); requestAnimationFrame(() => firstInput.current?.focus()) }}>リセット</button></div>
      </form>
      {error && <p id="color-error" className="error-box" role="alert">{error}</p>}
      <section className="calculation-result" aria-labelledby="color-result-title"><h2 id="color-result-title">変換結果</h2>
        {result && <figure className="color-preview"><div id="color-swatch" className="color-swatch" style={{ backgroundColor: result.hex }} role="img" aria-label={`${result.hex}の色見本`} /><figcaption>色見本：{result.hex}</figcaption></figure>}
        <div className="color-outputs">{(Object.keys(labels) as ColorFormat[]).map(output => <div key={output}><label className="field-label" htmlFor={`color-output-${output}`}>{labels[output]}</label><div className="color-output-row"><input id={`color-output-${output}`} type="text" value={result?.[output] ?? ''} readOnly placeholder="変換結果" aria-label={`${labels[output]}の変換結果`} /><button id={`color-copy-${output}`} className="secondary-button" type="button" aria-label={`${labels[output]}をコピー`} disabled={!result} onClick={() => { if (result) void clipboard.copy(result[output], `${labels[output]}をコピーしました`) }}>コピー</button></div></div>)}</div>
        <p className="calculation-status" role="status" aria-live="polite">{feedback || (result ? '変換しました。' : '入力して「変換する」を押してください。')}</p>
      </section>
    </section>
    <section className="tool-info"><h2>使い方と変換の範囲</h2><p>入力形式を選び、HEXはコード全体、RGB・HSLは各成分の数値を入力します。各「コピー」で表示された形式だけをコピーできます。入力や形式を変更すると前の結果とコピー通知は消えます。</p><p>不透明なsRGB色を扱います。HSL入力はRGBの0〜255の整数へ四捨五入（0.5は切り上げ）し、その色から全形式と色見本を生成します。HEXは大文字6桁、HSLは小数4桁までで末尾の0を省略します。黒・白・グレーの色相と彩度は0です。丸めにより入力したHSLと結果が少し異なる場合があります。</p><p>数値欄に%・deg・関数名・カンマ・指数表記は入力しません。空欄や範囲外はエラーにします。透明度、CMYK、広色域、配色提案、画面からの色取得は扱いません。色見本の見え方は端末や画面設定によって異なります。</p></section>
    <section className="tool-info"><h2>入力データについて</h2><p>すべてブラウザ内で処理します。入力と結果は保存・送信・URLへの埋め込みをせず、画面を離れると消えます。コピーしたときだけ選んだ形式をクリップボードへ書き込みます。お気に入りと最近使用に記録するのはツールのIDだけです。</p></section>
  </div>
}
