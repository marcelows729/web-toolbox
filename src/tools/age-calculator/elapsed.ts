import type { DatePartsValue } from '../../components/forms/dateParts'
export type ElapsedResult = { years: number; months: number; days: number; totalDays: number; start: string; reference: string }
type CivilDate = { year: number; month: number; day: number }
export const localTodayParts = (date = new Date()): DatePartsValue => ({ year: String(date.getFullYear()).padStart(4, '0'), month: String(date.getMonth() + 1).padStart(2, '0'), day: String(date.getDate()).padStart(2, '0') })
const daysInMonth = (year: number, month: number) => month === 2 ? (year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31
function parse(parts: DatePartsValue, label: string): CivilDate {
  if (!/^\d{4}$/.test(parts.year) || Number(parts.year) < 1) throw new Error(label + 'の年は0001〜9999の4桁で入力してください。')
  if (!/^\d{1,2}$/.test(parts.month) || !/^\d{1,2}$/.test(parts.day)) throw new Error(label + 'の月と日を入力してください。')
  const year = Number(parts.year), month = Number(parts.month), day = Number(parts.day)
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) throw new Error(label + 'に存在する日付を入力してください。')
  return { year, month, day }
}
// Civil dates use UTC only as an ordinal representation; no timezone/DST length enters the calculation.
const ordinal = ({ year, month, day }: CivilDate) => { const date = new Date(0); date.setUTCFullYear(year, month - 1, day); date.setUTCHours(0, 0, 0, 0); return date.getTime() / 86_400_000 }
const iso = ({ year, month, day }: CivilDate) => String(year).padStart(4, '0') + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0')
const anniversary = (start: CivilDate, months: number): CivilDate => {
  const index = start.year * 12 + start.month - 1 + months, year = Math.floor(index / 12), month = index % 12 + 1
  return { year, month, day: Math.min(start.day, daysInMonth(year, month)) }
}
export function calculateElapsed(startParts: DatePartsValue, referenceParts: DatePartsValue): ElapsedResult {
  const start = parse(startParts, '開始日'), reference = parse(referenceParts, '基準日'), begin = ordinal(start), end = ordinal(reference)
  if (end < begin) throw new Error('基準日は開始日と同じ日か、それより後の日にしてください。')
  let wholeMonths = (reference.year - start.year) * 12 + reference.month - start.month
  if (ordinal(anniversary(start, wholeMonths)) > end) wholeMonths--
  return { years: Math.floor(wholeMonths / 12), months: wholeMonths % 12, days: end - ordinal(anniversary(start, wholeMonths)), totalDays: end - begin, start: iso(start), reference: iso(reference) }
}
export const elapsedText = (value: ElapsedResult) => '経過年月・年齢計算\n開始日：' + value.start + '\n基準日：' + value.reference + '\n経過：満' + value.years + '年 ' + value.months + 'か月 ' + value.days + '日\n総日数：' + value.totalDays + '日\n月の区切りは開始日と同じ日。存在しない月は月末に補正（12か月＝1年）。'
