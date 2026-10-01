import { useEffect, useMemo, useRef, useState } from 'react'
import { parseCandidates, remainingCandidates, uniformIndex, wheelRotation } from './roulette'

const colors = ['#aad9c5', '#b9cff7', '#f4d59e', '#e5bce1', '#b9dfeb']
export default function RoulettePicker() {
  const [text, setText] = useState('コーヒー\n紅茶\nほうじ茶\nジュース')
  const [exclude, setExclude] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [winner, setWinner] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [snapshot, setSnapshot] = useState<string[] | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<(() => void) | null>(null)
  const running = useRef(false)
  const revision = useRef(0)
  const parsed = useMemo(() => { try { return { labels: parseCandidates(text), error: '' } } catch (cause) { return { labels: [], error: (cause as Error).message } } }, [text])
  const remaining = remainingCandidates(parsed.labels, selected, exclude)
  const wheel = snapshot ?? remaining
  const reset = () => { revision.current++; if (timer.current) clearTimeout(timer.current); pending.current = null; running.current = false; setBusy(false); setSelected([]); setWinner(null); setSnapshot(null); setRotation(0); setError('') }
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const finishEarly = () => { if (media.matches && pending.current) { if (timer.current) clearTimeout(timer.current); pending.current() } }
    media.addEventListener('change', finishEarly)
    // Timer and revision refs intentionally track the latest pending draw, rather than a DOM node.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { revision.current++; if (timer.current) clearTimeout(timer.current); pending.current = null; media.removeEventListener('change', finishEarly) }
  }, [])
  const draw = () => {
    if (running.current) return
    if (parsed.error || !remaining.length) { setError(parsed.error || 'すべて抽選済みです。抽選をリセットしてください。'); return }
    try {
      const index = uniformIndex(remaining.length)
      const chosen = remaining[index]
      const current = ++revision.current
      running.current = true; setBusy(true); setError(''); setWinner(null); setSnapshot(remaining)
      setRotation(wheelRotation(rotation, index, remaining.length))
      const finish = () => { if (revision.current !== current) return; pending.current = null; running.current = false; setBusy(false); setWinner(chosen); if (exclude) setSelected(previous => [...previous, chosen]) }
      pending.current = finish
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish()
      else timer.current = setTimeout(finish, 1800)
    } catch (cause) { setError((cause as Error).message) }
  }
  return <div className="container tool-page"><header className="tool-header"><h1>ルーレット抽選</h1><p>迷ったら、くるっと。候補を同じ確率で選びます。</p></header>
    <section className="tool-panel"><div className="everyday-columns roulette-layout"><div><label className="field-label" htmlFor="roulette-candidates">候補（1行に1件、2〜20件）</label><textarea id="roulette-candidates" rows={8} maxLength={20480} value={text} onChange={e => { reset(); setText(e.target.value) }} /><label className="roulette-check"><input type="checkbox" id="roulette-exclude" checked={exclude} onChange={e => { reset(); setExclude(e.target.checked) }} />選ばれた候補を次の抽選から除外する</label><p className="roulette-hint">1件50文字まで。同じ名前は使えません。候補を編集すると抽選履歴がリセットされます。</p></div>
    <div className="roulette-stage"><div className="roulette-pointer" aria-hidden="true">▼</div><div className="roulette-wheel" aria-hidden="true" style={{ transform: `rotate(${rotation}deg)`, background: wheel.length ? `conic-gradient(${wheel.map((_, i) => `${colors[i % colors.length]} ${i * 360 / wheel.length}deg ${(i + 1) * 360 / wheel.length}deg`).join(',')})` : 'var(--surface-alt)' }}>{wheel.map((_, i) => <span key={i} style={{ transform: `rotate(${(i + 0.5) * 360 / wheel.length}deg) translateY(-100px) rotate(${-(i + 0.5) * 360 / wheel.length}deg)` }}>{i + 1}</span>)}</div><div className="roulette-result" role="status" aria-live="polite">{busy ? '抽選中…' : winner !== null ? <><small>選ばれたのは</small><strong>{winner}</strong></> : '次は、どれにしよう？'}</div></div></div>
    <div className="action-row"><button className="primary-button" id="draw-roulette" disabled={busy || !!parsed.error || !remaining.length} onClick={draw}>ルーレットを回す</button><button className="secondary-button" id="reset-roulette" onClick={reset}>抽選をリセット</button><button className="secondary-button" onClick={() => { reset(); setText('') }}>候補を消去</button></div>
    {(error || parsed.error) && <p className="error-box" role="alert">{error || parsed.error}</p>}{!parsed.error && !remaining.length && <p>すべて抽選済みです。リセットするともう一度抽選できます。</p>}
    <p>残り {remaining.length}件 ／ 選択済み {selected.length}件</p><ol className="roulette-labels">{wheel.map(label => <li key={label}>{label}{selected.includes(label) && <small> 選択済み</small>}</li>)}</ol></section>
    <section className="tool-info"><h2>使い方・抽選仕様</h2><p>候補を入力し、ルーレットを回してください。安全な乱数を使い、余りによる偏りを取り除いて均等に抽選します。結果は回転前に決まり、アニメーションは表示用です。動きを減らす設定ではすぐ結果を表示します。抽選履歴はこの画面内だけで保持します。</p><p>入力した候補は保存せず、サーバーへ送信しません。</p></section>
  </div>
}
