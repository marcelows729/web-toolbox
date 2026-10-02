import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createCountdown, defaultCountdownFields, DEFAULT_COUNTDOWN_MS, formatCountdownTime, parseCountdownFields } from './timer'
import type { CountdownFields, CountdownSnapshot } from './timer'
import './countdown.css'

export default function CountdownTimer() {
  const [clock] = useState(() => createCountdown(() => performance.now()))
  const [fields, setFields] = useState(defaultCountdownFields)
  const [view, setView] = useState<CountdownSnapshot>(() => clock.snapshot())
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const finishedNotice = useRef(false)
  const startRef = useRef<HTMLButtonElement>(null)
  const hoursRef = useRef<HTMLInputElement>(null)
  const active = view.status === 'running' || view.status === 'paused'
  const finishMessage = '時間になりました。音は鳴りません。'
  const show = (next: CountdownSnapshot, message: string) => {
    setView(next)
    if (next.status === 'finished') { finishedNotice.current = true; setNotice(finishMessage) }
    else { finishedNotice.current = false; setNotice(message) }
  }
  useEffect(() => {
    // Development Strict Mode replays cleanup/setup using the same state object.
    if (clock.snapshot().duration === 0) clock.configure(DEFAULT_COUNTDOWN_MS)
    return () => { clock.clear(); finishedNotice.current = false }
  }, [clock])
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    const refresh = () => {
      const next = clock.snapshot()
      setView(previous => previous.status === next.status && previous.duration === next.duration && Math.ceil(previous.remaining / 1_000) === Math.ceil(next.remaining / 1_000) ? previous : next)
      if (next.status === 'finished') {
        if (!finishedNotice.current) { finishedNotice.current = true; setNotice(finishMessage) }
        if (interval) clearInterval(interval)
      }
    }
    const sync = () => {
      if (interval) clearInterval(interval)
      refresh()
      if (!document.hidden && clock.snapshot().status === 'running') interval = setInterval(refresh,250)
    }
    sync()
    document.addEventListener('visibilitychange',sync)
    const leave = () => { if (interval) clearInterval(interval); clock.clear(); finishedNotice.current = false }
    const restore = () => { clock.clear(); setView(clock.configure(DEFAULT_COUNTDOWN_MS)); setFields(defaultCountdownFields()); setError(''); setNotice(''); finishedNotice.current = false }
    window.addEventListener('pagehide',leave)
    window.addEventListener('pageshow',restore)
    return () => { if (interval) clearInterval(interval); document.removeEventListener('visibilitychange',sync); window.removeEventListener('pagehide',leave); window.removeEventListener('pageshow',restore) }
  }, [clock, view.status])
  const edit = (key: keyof CountdownFields, value: string) => {
    if (active) return
    const next = { ...fields, [key]: value }
    setFields(next); setNotice(''); finishedNotice.current = false
    try { setView(clock.configure(parseCountdownFields(next))); setError('') }
    catch (cause) { setView(clock.invalidate()); setError((cause as Error).message) }
  }
  const toggle = () => {
    try {
      const next = clock.snapshot().status === 'running' ? clock.pause() : clock.start()
      show(next,next.status === 'running' ? 'タイマーを開始しました。' : 'タイマーを一時停止しました。')
      setError('')
    } catch (cause) { setError((cause as Error).message) }
  }
  const reset = () => {
    const next = clock.reset()
    show(next,next.duration > 0 ? '設定した時間に戻しました。' : '指定時間を確認してください。')
    if (next.duration > 0) { setError(''); requestAnimationFrame(() => startRef.current?.focus()) } else hoursRef.current?.focus()
  }
  const state = { idle: '開始前', running: '計測中', paused: '一時停止中', finished: '終了' }[view.status]
  return <div className="container tool-page countdown-timer"><header className="tool-header"><h1>カウントダウンタイマー</h1><p>時間・分・秒を指定して、残り時間を確認します。</p></header>
    <section className="tool-panel" aria-label="カウントダウンタイマーの操作">
      <fieldset className="countdown-fields" disabled={active} aria-describedby="countdown-input-help"><legend>指定時間</legend>{(['hours','minutes','seconds'] as const).map((key,index) => <label className="field-label" htmlFor={'countdown-'+key} key={key}>{['時間','分','秒'][index]}<input ref={key === 'hours' ? hoursRef : undefined} id={'countdown-'+key} type="text" inputMode="numeric" value={fields[key]} aria-invalid={!!error} aria-describedby={error ? 'countdown-error' : 'countdown-input-help'} onChange={event => edit(key,event.target.value)} /><small>{index === 0 ? '0〜24' : '0〜59'}</small></label>)}</fieldset>
      <p id="countdown-input-help" className="text-format-help">1秒〜24時間。空欄は0です。計測中・一時停止中の変更はリセットしてから。</p>
      {error && <p id="countdown-error" className="error-box" role="alert">{error}</p>}
      <p id="countdown-state" className="countdown-state">{state}</p><p id="countdown-time" className="countdown-time" aria-label="残り時間" aria-live="off">{formatCountdownTime(view.remaining)}</p><p className="text-format-help">時間:分:秒。端数は切り上げて表示します。</p>
      <div className="action-row"><button id="countdown-start" ref={startRef} type="button" className="primary-button" disabled={view.duration === 0 || view.status === 'finished'} onClick={toggle}>{view.status === 'running' ? '一時停止' : view.status === 'paused' ? '再開' : view.status === 'finished' ? '終了' : '開始'}</button><button id="countdown-reset" type="button" className="secondary-button" onClick={reset}>リセット</button></div>
      <p id="countdown-notice" className="text-format-status" role="status" aria-live="polite">{notice}</p>
      <div className="countdown-notes"><p><strong>音は鳴りません。</strong>終了は画面で確認してください。</p><p>ブラウザ終了・再読込・ページ移動で消去します。端末スリープ中の動作は保証しません。</p><p>終了後はリセットするか、指定時間を変更してから開始してください。リセットは設定した時間に戻します。</p></div>
    </section>
    <section className="tool-info"><h2>使い方と動作の範囲</h2><p>半角の整数で時間・分・秒を入力し、開始してください。一時停止中は残り時間を保ち、再開するとそこから計測します。計測中と一時停止中の入力は固定します。時間を変更すると開始前の状態に戻り、新しい時間で最初から計測します。0秒や24時間を超える時間では開始できません。</p><p>単調時計の起点との差分で残り時間を求め、通常の背景タブで表示更新が間引かれても、復帰時に現在の残り時間を取得します。表示を約0.25秒ごとに確認し、秒の表示や状態が変わるときだけ画面を更新します。終了の表示にはブラウザの処理による遅れがあり、厳密な時刻や期限の保証はしません。</p><p>音・通知・振動や権限要求はありません。ブラウザを閉じたり、このページを離れると計測を停止し、入力と記録を消去します。OSスリープ中の動作や、ページ再読み込みをまたぐ継続は保証しません。</p></section>
    <section className="tool-info"><h2>入力データについて</h2><p>指定時間と計測状態はこのページを開いている間の端末メモリだけで扱い、保存・外部送信・URLへの埋め込みはしません。お気に入り・最近使用にはツールIDだけを記録します。</p></section>
    <section className="tool-info"><h2>関連ツール</h2><div className="calculation-related"><Link to="/tools/stopwatch">ストップウォッチ</Link><Link to="/tools/duration-calculator">時間の足し算・引き算</Link></div></section>
  </div>
}
