import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { addWorldCity, initialWorldCities, MAX_WORLD_CITIES, removeWorldCity, WORLD_CITIES, worldClockSnapshot, worldClockText } from './clock'
import type { WorldClockSnapshot } from './clock'

export default function WorldClock() {
  const [ids, setIds] = useState(initialWorldCities)
  const [choice, setChoice] = useState('')
  const [view, setView] = useState<WorldClockSnapshot | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const revision = useRef(0)
  const citySelect = useRef<HTMLSelectElement>(null)
  const copyButton = useRef<HTMLButtonElement>(null)
  const invalidateCopy = () => { revision.current += 1; setCopied(null); setNotice('') }
  useEffect(() => {
    let timer: number | undefined, parked = false, active = true
    const stop = () => { if (timer !== undefined) { window.clearInterval(timer); timer = undefined } }
    const refresh = () => {
      if (!active) return
      try { setView(worldClockSnapshot(ids, Date.now())); setError('') }
      catch { setView(null); setError('地域の時刻を表示できません。端末の時計とブラウザの時刻情報を確認してください。') }
    }
    const sync = () => { stop(); if (!parked && !document.hidden) { refresh(); timer = window.setInterval(refresh, 1000) } }
    const leave = () => { parked = true; stop(); revision.current += 1; setCopied(null); setNotice('') }
    const restore = () => { parked = false; sync() }
    sync(); document.addEventListener('visibilitychange', sync); window.addEventListener('pagehide', leave); window.addEventListener('pageshow', restore)
    return () => { active = false; revision.current += 1; stop(); document.removeEventListener('visibilitychange', sync); window.removeEventListener('pagehide', leave); window.removeEventListener('pageshow', restore) }
  }, [ids])
  const change = (next: string[], message: string) => {
    invalidateCopy(); setIds(next); setChoice(''); setNotice(message)
    requestAnimationFrame(() => { if (next.length < MAX_WORLD_CITIES) citySelect.current?.focus(); else copyButton.current?.focus() })
  }
  const copy = async () => {
    const current = ++revision.current
    setNotice('')
    try {
      const snapshot = worldClockSnapshot(ids, Date.now()), text = worldClockText(snapshot)
      setView(snapshot); setError(''); setCopied(text)
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
        await navigator.clipboard.writeText(text)
        if (current === revision.current) setNotice('コピー時点の時刻一覧をコピーしました。')
      } catch { if (current === revision.current) setNotice('コピーできませんでした。下のコピー内容を選択して手動でコピーしてください。') }
    } catch { setView(null); setCopied(null); setError('地域の時刻を表示できません。端末の時計とブラウザの時刻情報を確認してください。') }
  }
  const available = WORLD_CITIES.filter(city => !ids.includes(city.id))
  return <div className="container tool-page world-clock"><header className="tool-header"><h1>世界時計</h1><p>東京・UTCと、海外の都市の今の時刻を並べて確認します。</p></header>
    <section className="tool-panel" aria-label="世界時計の操作と時刻一覧">
      <p id="world-clock-help" className="text-format-help">端末の時計に基づく時刻です。日付・曜日・UTC差は、ブラウザの地域時刻情報に従います。</p>
      <div className="world-clock-actions"><label className="field-label" htmlFor="world-clock-city">追加する都市<select ref={citySelect} id="world-clock-city" value={choice} disabled={ids.length >= MAX_WORLD_CITIES} aria-describedby="world-clock-limit" onChange={event => { setChoice(event.target.value); invalidateCopy() }}><option value="">都市を選ぶ</option>{available.map(city => <option key={city.id} value={city.id}>{city.name}（{city.region}）</option>)}</select></label><button id="world-clock-add" type="button" className="primary-button" disabled={!choice || ids.length >= MAX_WORLD_CITIES} onClick={() => { try { const selected = WORLD_CITIES.find(city => city.id === choice); change(addWorldCity(ids, choice), `${selected?.name}を追加しました。`) } catch (cause) { setNotice((cause as Error).message) } }}>追加</button><button ref={copyButton} id="world-clock-copy" type="button" className="secondary-button" disabled={!view} onClick={() => void copy()}>時刻一覧をコピー</button><button id="world-clock-reset" type="button" className="secondary-button" onClick={() => change(initialWorldCities(), '初期の4つに戻しました。')}>リセット</button></div>
      <p id="world-clock-limit" className="text-format-help">表示 {ids.length}/{MAX_WORLD_CITIES}。東京・UTCは基準です。{ids.length >= MAX_WORLD_CITIES ? '追加するには都市を外してください。' : '同じ都市は重複して追加できません。'}</p>
      {error && <p className="error-box" role="alert" id="world-clock-error">{error}</p>}
      <p id="world-clock-notice" className="text-format-status" role="status" aria-live="polite">{notice}</p>
      <ul className="world-clock-list" aria-label="各都市の現在時刻" aria-live="off">{view?.rows.map(row => <li key={row.city.id} data-world-city={row.city.id}><div className="world-clock-city-heading"><h2>{row.city.name}<small>{row.city.region}</small></h2>{row.city.fixed ? <span className="world-clock-basis">基準</span> : <button type="button" className="secondary-button" aria-label={row.city.name + 'を外す'} onClick={() => change(removeWorldCity(ids, row.city.id), row.city.name + 'を外しました。')}>外す</button>}</div><dl><div><dt className="visually-hidden">日付と曜日</dt><dd className="world-clock-date">{row.date}（{row.weekday}）</dd></div><div><dt className="visually-hidden">時刻</dt><dd className="world-clock-time"><time dateTime={view.instant}>{row.time}</time></dd></div><div><dt className="visually-hidden">UTCオフセット</dt><dd className="world-clock-offset">{row.offset}</dd></div></dl></li>)}</ul>
      {copied !== null && <div className="world-clock-copy"><label className="field-label" htmlFor="world-clock-copy-text">コピー内容（操作時点）</label><textarea id="world-clock-copy-text" readOnly value={copied} rows={8} spellCheck={false} /></div>}
    </section>
    <section className="tool-info"><h2>使い方</h2><p>東京・UTC・ニューヨーク・ロンドンを最初に表示します。ロサンゼルス・パリ・シドニーも選べます。最大6つまでで、東京・UTC以外は外せます。地域によって日付や曜日が異なるため、時刻と一緒に確認してください。</p><p>表示は約1秒ごとに更新し、画面へ戻ったときは現在の端末時刻を取り直します。夏時間もブラウザのタイムゾーン情報から反映します。端末時計のずれや、地域時刻情報の更新状況によって実際の時刻とずれる場合があります。</p><p>コピーはクリック時の同じ瞬間で全都市をそろえます。下のコピー内容は、その後の時計更新には追従しません。任意日時の変換や予定の保存・通知・位置取得は扱いません。</p></section>
    <section className="tool-info"><h2>データについて</h2><p>時刻と都市の選択はこの画面のメモリ内だけで扱い、保存・送信・URLへの埋め込みはしません。再読込や一覧からの再入場で初期表示に戻ります。外部の時計サービスへ接続せず、コピー操作時だけクリップボードへ書き込みます。道具棚へ記録するのはツールIDだけです。</p></section>
    <section className="tool-info"><h2>関連ツール</h2><div className="calculation-related"><Link to="/tools/timestamp-converter">Timestamp Converter</Link><Link to="/tools/date-calculator">日付・日数計算</Link></div></section>
  </div>
}
