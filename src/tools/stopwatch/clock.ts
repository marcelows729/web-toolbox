export const MAX_STOPWATCH_MS = 999 * 3_600_000 + 59 * 60_000 + 59_990
export const MAX_LAPS = 100
export type Lap = { total: number; interval: number }
export type StopwatchSnapshot = { elapsed: number; running: boolean; limited: boolean; laps: Lap[] }

// The injected monotonic clock is the only time source; refresh never adds ticks.
export function createStopwatch(now: () => number) {
  let accumulated = 0
  let origin = 0
  let lastNow = 0
  let running = false
  let laps: Lap[] = []
  const read = () => {
    const value = now()
    if (Number.isFinite(value)) lastNow = Math.max(lastNow, value)
    return lastNow
  }
  const snapshot = (): StopwatchSnapshot => {
    const elapsed = Math.min(MAX_STOPWATCH_MS, accumulated + (running ? Math.max(0, read() - origin) : 0))
    if (elapsed >= MAX_STOPWATCH_MS) {
      accumulated = MAX_STOPWATCH_MS
      running = false
    }
    return { elapsed, running, limited: elapsed >= MAX_STOPWATCH_MS, laps: laps.map(lap => ({ ...lap })) }
  }
  return {
    snapshot,
    start() {
      const current = snapshot()
      if (!current.running && !current.limited) { origin = read(); running = true }
      return snapshot()
    },
    pause() {
      accumulated = snapshot().elapsed
      running = false
      return snapshot()
    },
    lap() {
      const current = snapshot()
      if (current.running && laps.length < MAX_LAPS) {
        const previous = laps.at(-1)?.total ?? 0
        laps.push({ total: current.elapsed, interval: Math.max(0, current.elapsed - previous) })
      }
      return snapshot()
    },
    reset() {
      accumulated = 0
      running = false
      laps = []
      return snapshot()
    },
  }
}

export function formatStopwatchTime(milliseconds: number) {
  const value = Math.floor(Math.min(MAX_STOPWATCH_MS, Math.max(0, Number.isFinite(milliseconds) ? milliseconds : 0)) / 10)
  const hours = Math.floor(value / 360_000), minutes = Math.floor(value / 6_000) % 60, seconds = Math.floor(value / 100) % 60, hundredths = value % 100
  return [hours, minutes, seconds].map(part => String(part).padStart(2, '0')).join(':') + '.' + String(hundredths).padStart(2, '0')
}

export function stopwatchText(snapshot: StopwatchSnapshot) {
  return ['ストップウォッチ', '合計時間：' + formatStopwatchTime(snapshot.elapsed), '状態：' + (snapshot.limited ? '上限で停止' : snapshot.running ? '計測中（コピー時点）' : '停止中'), ...snapshot.laps.map((lap,index) => 'ラップ ' + (index + 1) + '：区間 ' + formatStopwatchTime(lap.interval) + ' / 合計 ' + formatStopwatchTime(lap.total))].join('\n')
}
