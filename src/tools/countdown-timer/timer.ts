export const MIN_COUNTDOWN_MS = 1_000
export const MAX_COUNTDOWN_MS = 24 * 3_600_000
export const DEFAULT_COUNTDOWN_MS = 5 * 60_000
export type CountdownFields = { hours: string; minutes: string; seconds: string }
export type CountdownStatus = 'idle' | 'running' | 'paused' | 'finished'
export type CountdownSnapshot = { duration: number; remaining: number; status: CountdownStatus }
export const defaultCountdownFields = (): CountdownFields => ({ hours: '0', minutes: '5', seconds: '0' })

export function validateCountdownDuration(duration: number) {
  if (!Number.isInteger(duration) || duration % 1_000 !== 0 || duration < MIN_COUNTDOWN_MS || duration > MAX_COUNTDOWN_MS) throw new Error('1秒以上、24時間以下の整数秒を指定してください。')
}

export function parseCountdownFields(fields: CountdownFields) {
  const parts = (['hours','minutes','seconds'] as const).map((key,index) => {
    const value = fields[key].trim()
    if (value !== '' && !/^[0-9]{1,2}$/.test(value)) throw new Error('時間・分・秒は半角の整数で入力してください。空欄は0として扱います。')
    const number = Number(value)
    if (number > (index === 0 ? 24 : 59)) throw new Error('時間は0〜24、分・秒は0〜59で入力してください。')
    return number
  })
  const duration = (parts[0] * 3_600 + parts[1] * 60 + parts[2]) * 1_000
  validateCountdownDuration(duration)
  return duration
}

// Only monotonic origin differences measure time; refresh does not subtract ticks.
export function createCountdown(now: () => number, initialDuration = DEFAULT_COUNTDOWN_MS) {
  validateCountdownDuration(initialDuration)
  let duration = initialDuration
  let remainingAtStart = duration
  let origin = 0
  let lastNow = 0
  let status: CountdownStatus = 'idle'
  const read = () => {
    const value = now()
    if (Number.isFinite(value)) lastNow = Math.max(lastNow, value)
    return lastNow
  }
  const snapshot = (): CountdownSnapshot => {
    const remaining = status === 'running' ? Math.max(0, remainingAtStart - Math.max(0, read() - origin)) : remainingAtStart
    if (status === 'running' && remaining === 0) { remainingAtStart = 0; status = 'finished' }
    return { duration, remaining, status }
  }
  const editable = () => {
    if (status === 'running' || status === 'paused') throw new Error('時間を変更するには、先にリセットしてください。')
  }
  return {
    snapshot,
    configure(nextDuration: number) {
      editable()
      validateCountdownDuration(nextDuration)
      duration = nextDuration
      remainingAtStart = duration
      status = 'idle'
      return snapshot()
    },
    invalidate() {
      editable()
      duration = 0
      remainingAtStart = 0
      status = 'idle'
      return snapshot()
    },
    start() {
      if (status === 'idle' || status === 'paused') {
        validateCountdownDuration(duration)
        origin = read()
        status = 'running'
      }
      return snapshot()
    },
    pause() {
      const current = snapshot()
      if (current.status === 'running') { remainingAtStart = current.remaining; status = 'paused' }
      return snapshot()
    },
    reset() {
      remainingAtStart = duration
      status = 'idle'
      return snapshot()
    },
    clear() {
      duration = 0
      remainingAtStart = 0
      status = 'idle'
      return snapshot()
    },
  }
}

export function formatCountdownTime(milliseconds: number) {
  // Round up so a positive fraction of a second never displays as already finished.
  const seconds = Math.ceil(Math.min(MAX_COUNTDOWN_MS, Math.max(0, Number.isFinite(milliseconds) ? milliseconds : 0)) / 1_000)
  return [Math.floor(seconds / 3_600), Math.floor(seconds / 60) % 60, seconds % 60].map(part => String(part).padStart(2,'0')).join(':')
}
