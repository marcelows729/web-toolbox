import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createStopwatch, formatStopwatchTime, MAX_LAPS, stopwatchText } from './clock'
import type { StopwatchSnapshot } from './clock'
import './stopwatch.css'

export default function Stopwatch() {
  const [clock] = useState(() => createStopwatch(() => performance.now()))
  const [view, setView] = useState<StopwatchSnapshot>(() => clock.snapshot())
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const revision = useRef(0)
  const startRef = useRef<HTMLButtonElement>(null)
  const change = (next: StopwatchSnapshot, message: string) => { revision.current += 1; setCopied(null); setNotice(message); setView(next) }
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    const refresh = () => {
      const next = clock.snapshot()
      setView(next)
      if (next.limited) { setNotice('計測上限の999時間59分59秒99で停止しました。'); if (timer) clearInterval(timer) }
    }
    const sync = () => {
      if (timer) clearInterval(timer)
      refresh()
      if (!document.hidden && clock.snapshot().running) timer = setInterval(refresh, 100)
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    const leave = () => { clock.reset(); revision.current += 1 }
    window.addEventListener('pagehide', leave)
    const restore = () => { setView(clock.snapshot()); setCopied(null); setNotice('') }
    window.addEventListener('pageshow', restore)
    return () => { if (timer) clearInterval(timer); document.removeEventListener('visibilitychange',sync); window.removeEventListener('pagehide',leave); window.removeEventListener('pageshow',restore) }
  }, [clock, view.running])
  useEffect(() => () => { clock.reset(); revision.current += 1 }, [clock])
  const copy = async () => {
    const text = stopwatchText(clock.snapshot()), current = ++revision.current
    setCopied(text); setNotice('')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(text)
      if (revision.current === current) setNotice('コピー時点の合計時間とラップをコピーしました。')
    } catch { if (revision.current === current) setNotice('コピーできませんでした。下のコピー内容を選択して手動でコピーしてください。') }
  }
  const stateLabel = view.limited ? '上限で停止' : view.running ? '計測中' : view.elapsed > 0 ? '一時停止中' : '開始前'
  return <div className="container tool-page stopwatch"><header className="tool-header"><h1>ストップウォッチ</h1><p>勉強・作業・運動の経過時間を計り、ラップごとの区間時間を記録します。</p></header>
    <section className="tool-panel" aria-label="ストップウォッチの操作">
      <p className="stopwatch-state" id="stopwatch-state">{stateLabel}</p>
      <p className="stopwatch-time" id="stopwatch-time" aria-label="合計経過時間" aria-live="off">{formatStopwatchTime(view.elapsed)}</p>
      <p className="text-format-help">時間:分:秒.百分の一秒。表示は約0.1秒ごとに更新します。</p>
      <div className="action-row"><button id="stopwatch-start" ref={startRef} type="button" className="primary-button" disabled={view.limited} onClick={() => { const next = clock.snapshot().running ? clock.pause() : clock.start(); change(next,next.limited ? '計測上限の999時間59分59秒99で停止しました。' : next.running ? '計測を開始しました。' : '計測を一時停止しました。') }}>{view.running ? '一時停止' : view.elapsed > 0 ? '再開' : '開始'}</button><button id="stopwatch-lap" type="button" className="secondary-button" disabled={!view.running || view.laps.length >= MAX_LAPS} onClick={() => { const previous = clock.snapshot().laps.length; const next = clock.lap(); change(next,next.limited ? '計測上限の999時間59分59秒99で停止しました。' : next.laps.length > previous ? 'ラップ ' + next.laps.length + ' を記録しました。区間 ' + formatStopwatchTime(next.laps.at(-1)?.interval ?? 0) + '。' : 'ラップは計測中に100件まで記録できます。') }}>ラップを記録</button><button id="stopwatch-reset" type="button" className="secondary-button" onClick={() => { change(clock.reset(),'時間とラップをリセットしました。'); startRef.current?.focus() }}>リセット</button><button id="stopwatch-copy" type="button" className="secondary-button" onClick={() => void copy()}>記録をコピー</button></div>
      <p id="stopwatch-notice" className="text-format-status" role="status" aria-live="polite">{notice}</p>
      <div className="stopwatch-laps"><h2>ラップ記録 <span>（{view.laps.length}/{MAX_LAPS}）</span></h2>{view.laps.length >= MAX_LAPS && <p>100件の上限に達しました。計測は続けられます。</p>}{view.laps.length === 0 ? <p className="text-format-help">計測中に「ラップを記録」を押すと、前のラップからの区間時間と合計時間を残せます。</p> : <ol id="stopwatch-laps">{view.laps.map((lap,index) => <li key={index}><strong>ラップ {index + 1}</strong><dl><div><dt>区間</dt><dd>{formatStopwatchTime(lap.interval)}</dd></div><div><dt>合計</dt><dd>{formatStopwatchTime(lap.total)}</dd></div></dl></li>)}</ol>}</div>
      {copied !== null && <div className="stopwatch-copy"><label className="field-label" htmlFor="stopwatch-copy-text">コピー内容（コピー操作時点）</label><textarea id="stopwatch-copy-text" value={copied} readOnly rows={6} spellCheck={false} /></div>}
    </section>
    <section className="tool-info"><h2>使い方と計測の範囲</h2><p>開始、一時停止、再開で経過時間を計ります。一時停止中の時間は加算しません。ラップは計測中のみ最大100件まで記録でき、同じ時点の連続操作では区間が0になることがあります。リセットすると時間とすべてのラップを消去します。</p><p>24時間を超えても日付に戻さず時間を繰り上げ、最大999時間59分59秒99で停止します。百分の一秒は表示単位であり、精密測定の精度を保証するものではありません。</p><p>単調時計の起点との差分を使い、通常のバックグラウンドタブで表示更新が間引かれても、復帰時に経過時間を取得します。OSスリープ中の計測、ブラウザ終了、ページ再読み込みをまたぐ継続や正確さは保証しません。正確な競技計測などには専用の時計を使ってください。</p><p>別のページへ移動・再読み込み・タブを閉じると計測を停止し、記録を消去します。必要な記録は離れる前にコピーしてください。コピーは操作時点の時間で、その後の計測に追従しません。通知音・振動や通知権限は使いません。</p></section>
    <section className="tool-info"><h2>記録データについて</h2><p>時間とラップはこのページを開いている間の端末メモリだけで扱い、保存・送信・URLへの埋め込みはしません。コピー操作時だけ記録をクリップボードへ書き込みます。お気に入り・最近使用にはツールIDだけを記録します。</p></section>
    <section className="tool-info"><h2>関連ツール</h2><div className="calculation-related"><Link to="/tools/duration-calculator">時間の足し算・引き算</Link><Link to="/tools/date-calculator">日付・日数計算</Link></div></section>
  </div>
}
