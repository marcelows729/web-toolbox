export const SEQUENCE_LIMITS = { count: 10_000, output: 100_000, width: 20, affix: 100, numericInput: 32 } as const
export const MAX_SEQUENCE_VALUE = 999_999_999_999_999_999n
export type SequenceValues = { start: string; count: string; step: string; width: string; prefix: string; suffix: string }
export type SequenceField = keyof SequenceValues
export const initialSequence = (): SequenceValues => ({ start: '1', count: '10', step: '1', width: '', prefix: '', suffix: '' })
const names: Record<SequenceField, string> = { start: '開始番号', count: '件数', step: '増分', width: 'ゼロ埋めの桁数', prefix: '前につける文字', suffix: '後につける文字' }
export function validateSequenceField(field: SequenceField, value: string): void {
  const limit = field === 'prefix' || field === 'suffix' ? SEQUENCE_LIMITS.affix : SEQUENCE_LIMITS.numericInput
  if (value.length > limit) throw new Error(names[field] + 'は' + limit + '文字までです。')
  if ((field === 'prefix' || field === 'suffix') && /[\r\n\u2028\u2029]/.test(value)) throw new Error(names[field] + 'に改行は使えません。')
}
function integer(field: SequenceField, raw: string): bigint {
  validateSequenceField(field, raw)
  const value = raw.trim().replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[＋]/g, '+').replace(/[－−]/g, '-')
  if (!/^[+-]?\d+$/.test(value)) throw new Error(names[field] + 'を整数で入力してください。小数・指数・カンマは使えません。')
  return BigInt(value)
}
export function generateSequence(values: SequenceValues): string {
  for (const field of Object.keys(values) as SequenceField[]) validateSequenceField(field, values[field])
  const start = integer('start', values.start), step = integer('step', values.step), count = integer('count', values.count)
  const width = values.width.trim() === '' ? 0n : integer('width', values.width)
  if (count < 1n || count > BigInt(SEQUENCE_LIMITS.count)) throw new Error('件数は1〜10,000件にしてください。')
  if (width < 0n || width > BigInt(SEQUENCE_LIMITS.width)) throw new Error('ゼロ埋めの桁数は0〜20にしてください。空欄または0でゼロ埋めしません。')
  const end = start + step * (count - 1n)
  if ([start, step, end].some(n => n < -MAX_SEQUENCE_VALUE || n > MAX_SEQUENCE_VALUE)) throw new Error('開始番号・増分・生成する番号は、正負それぞれ18桁以内にしてください。')
  const size = Number(count), digits = Number(width)
  const format = (n: bigint) => (n < 0n ? '-' : '') + (n < 0n ? -n : n).toString().padStart(digits, '0')
  // Bound the exact result before allocating its lines; all arithmetic remains integer-exact.
  let length = size - 1
  for (let i = 0; i < size; i++) {
    length += values.prefix.length + format(start + step * BigInt(i)).length + values.suffix.length
    if (length > SEQUENCE_LIMITS.output) throw new Error('結果が100,000文字を超えます。件数・桁数・前後文字を減らしてください。')
  }
  return Array.from({ length: size }, (_, i) => values.prefix + format(start + step * BigInt(i)) + values.suffix).join('\n')
}
