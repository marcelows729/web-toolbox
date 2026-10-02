export const REPLACE_LIMITS = { input: 50_000, search: 1_000, replacement: 10_000, output: 100_000 } as const
export type ReplaceField = 'input' | 'search' | 'replacement'
const labels = { input: '元の本文', search: '検索文字列', replacement: '置換文字列' }
export function validateReplaceField(field: ReplaceField, value: string): void {
  if (value.length > REPLACE_LIMITS[field]) throw new Error(`${labels[field]}は${REPLACE_LIMITS[field].toLocaleString('ja-JP')}文字相当までです。超える入力は受け付けません。`)
}
export const normalizeReplaceLines = (value: string): string => value.replace(/\r\n?/g, '\n')
export function replaceLiteral(input: string, search: string, replacement: string): { output: string; count: number } {
  validateReplaceField('input', input); validateReplaceField('search', search); validateReplaceField('replacement', replacement)
  const source = normalizeReplaceLines(input), needle = normalizeReplaceLines(search), insert = normalizeReplaceLines(replacement)
  if (!needle) throw new Error('検索文字列を入力してください。空文字では置換できません。')
  let count = 0, cursor = 0, position: number
  while ((position = source.indexOf(needle, cursor)) !== -1) { count++; cursor = position + needle.length }
  const outputLength = source.length + count * (insert.length - needle.length)
  if (outputLength > REPLACE_LIMITS.output) throw new Error('結果が100,000文字相当を超えます。本文または置換文字列を短くしてください。')
  // Check amplification before allocating any replacement chunks. Replacement text is literal.
  const chunks: string[] = []
  cursor = 0
  while ((position = source.indexOf(needle, cursor)) !== -1) { chunks.push(source.slice(cursor, position), insert); cursor = position + needle.length }
  chunks.push(source.slice(cursor))
  return { output: chunks.join(''), count }
}
