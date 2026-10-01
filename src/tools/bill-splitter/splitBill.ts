import { normalizeNumeric } from '../unit-converter/conversion'
export type CollectionMode = 'exact' | '10' | '100'
export type BillSplit = { groups: Array<{ amount: number; count: number }>; total: number; people: number; collected: number; change: number; mode: CollectionMode }
export function parseBillInteger(text: string, min: number, max: number, label: string): number {
  const value = normalizeNumeric(text)
  if (!/^\d+$/.test(value) || value.length > 12) throw new Error(`${label}は${min.toLocaleString('ja-JP')}〜${max.toLocaleString('ja-JP')}の整数で入力してください。`)
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < min || number > max) throw new Error(`${label}は${min.toLocaleString('ja-JP')}〜${max.toLocaleString('ja-JP')}で入力してください。`)
  return number
}
export function splitBill(total: number, people: number, mode: CollectionMode): BillSplit {
  if (!Number.isInteger(total) || total < 0 || total > 1000000000) throw new Error('合計は0〜10億円の整数で入力してください。')
  if (!Number.isInteger(people) || people < 1 || people > 100) throw new Error('人数は1〜100人の整数で入力してください。')
  if (!['exact', '10', '100'].includes(mode)) throw new Error('集金方法を確認してください。')
  if (mode === 'exact') {
    const base = Math.floor(total / people)
    const extra = total % people
    const groups = [{ amount: base + 1, count: extra }, { amount: base, count: people - extra }].filter(group => group.count > 0)
    return { total, people, groups, collected: total, change: 0, mode }
  }
  const step = Number(mode)
  const amount = Math.ceil(total / (people * step)) * step
  const collected = amount * people
  return { total, people, groups: [{ amount, count: people }], collected, change: collected - total, mode }
}
export const yen = (value: number) => `${value.toLocaleString('ja-JP')}円`
export function billSummary(result: BillSplit): string {
  return [result.mode === 'exact' ? '1円単位で正確に配分' : `${result.mode}円単位で同額を集金`,
    ...result.groups.map(group => `${yen(group.amount)} × ${group.count}人`),
    `支払合計：${yen(result.total)}`, `集金合計：${yen(result.collected)}`, `余り：${yen(result.change)}`].join('\n')
}
