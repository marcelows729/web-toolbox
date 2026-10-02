export type DurationInput = { operation: 'add' | 'subtract'; hours: string; minutes: string; seconds: string }
export const MAX_ROWS = 20
export const MAX_HOURS = 999999
export const MAX_TOTAL_SECONDS = MAX_ROWS * (MAX_HOURS * 3600 + 3599)
function integer(raw: string, max: number, label: string): number {
  const value = raw.trim().replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
  if (value === '') return 0
  if (!/^\d{1,12}$/.test(value) || Number(value) > max) throw new Error(label + 'は0〜' + max + 'の整数で入力してください。')
  return Number(value)
}
export function calculateDuration(rows: readonly DurationInput[]): number {
  if (rows.length < 1 || rows.length > MAX_ROWS) throw new Error('時間は1〜20行で入力してください。')
  let total = 0
  rows.forEach((row, index) => {
    if (row.operation !== 'add' && row.operation !== 'subtract') throw new Error('足す・引くを選んでください。')
    const prefix = (index + 1) + '行目の'
    const seconds = integer(row.hours, MAX_HOURS, prefix + '時間') * 3600 + integer(row.minutes, 59, prefix + '分') * 60 + integer(row.seconds, 59, prefix + '秒')
    total += row.operation === 'add' ? seconds : -seconds
  })
  if (!Number.isSafeInteger(total) || Math.abs(total) > MAX_TOTAL_SECONDS) throw new Error('合計が計算できる範囲を超えています。')
  return total === 0 ? 0 : total
}
export function formatDuration(total: number) {
  if (!Number.isSafeInteger(total) || Math.abs(total) > MAX_TOTAL_SECONDS) throw new Error('合計が計算できる範囲を超えています。')
  const absolute = Math.abs(total), hours = Math.floor(absolute / 3600), minutes = Math.floor(absolute % 3600 / 60), seconds = absolute % 60
  const sign = total < 0 ? '-' : ''
  // Decimal minutes are rounded only for display; the calculation stays in integer seconds.
  const wholeMinutes = Math.floor(absolute / 60), remainder = absolute % 60
  const fraction = Math.round(remainder * 1000000 / 60)
  const decimalMinutes = sign + (fraction === 1000000 ? String(wholeMinutes + 1) : String(wholeMinutes) + (fraction ? '.' + String(fraction).padStart(6, '0').replace(/0+$/, '') : ''))
  return { human: sign + hours + '時間' + minutes + '分' + seconds + '秒', clock: sign + String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0'), minutes: decimalMinutes, seconds: String(total === 0 ? 0 : total) }
}
export function durationSummary(total: number): string {
  const result = formatDuration(total)
  return ['時間の足し算・引き算', '合計: ' + result.human, 'HH:MM:SS: ' + result.clock, '合計分: ' + result.minutes + '分（小数6桁まで）', '合計秒: ' + result.seconds + '秒'].join('\n')
}
