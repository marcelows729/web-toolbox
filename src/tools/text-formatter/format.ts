import { countLines, textCounts } from '../character-counter/count'

export const MAX_TEXT_UNITS = 50_000
export const MAX_TEXT_LINES = 5_000
export const TEXT_OPERATIONS = [
  { id: 'trimLines', label: '各行の前後の空白を除去', detail: '半角・全角空白、タブなどを行の両端から取り除きます。' },
  { id: 'removeBlankLines', label: '空行を削除', detail: '空白・タブだけの行も削除します。' },
  { id: 'collapseBlankLines', label: '連続する空行を1行に', detail: '連続する空行のうち、最初の行だけを残します。' },
  { id: 'dedupeLines', label: '完全一致する重複行を除去', detail: '最初の行を残します。大小文字や見た目が似た文字を同一視しません。' },
  { id: 'joinLines', label: '改行を半角空白に置換', detail: '改行1つを空白1つにします。前後の空白は自動で詰めません。' },
] as const
export type TextOperation = typeof TEXT_OPERATIONS[number]['id']
export type TextOptions = Record<TextOperation, boolean>
export const defaultTextOptions = (): TextOptions => ({ trimLines: false, removeBlankLines: false, collapseBlankLines: false, dedupeLines: false, joinLines: false })
export type TextFormatting = { output: string; before: ReturnType<typeof textCounts>; after: ReturnType<typeof textCounts> }

export function validateTextInput(input: string): void {
  if (input.length > MAX_TEXT_UNITS) throw new Error('入力は50,000文字相当までです。絵文字などは上限の計算では複数文字として数えます。')
  if (countLines(input) > MAX_TEXT_LINES) throw new Error('入力は5,000行までにしてください。末尾の改行も1行分を増やします。')
}

export function formatText(input: string, options: TextOptions): TextFormatting {
  validateTextInput(input)
  for (const operation of TEXT_OPERATIONS) if (typeof options[operation.id] !== 'boolean') throw new Error('整形する操作を確認してください。')
  const parts = input.split(/(\r\n|\r|\n)/)
  let lines: Array<{ text: string; ending: string }> = []
  for (let index = 0; index < parts.length; index += 2) lines.push({ text: options.trimLines ? parts[index].trim() : parts[index], ending: parts[index + 1] || '' })
  if (options.removeBlankLines) lines = lines.filter(line => line.text.trim() !== '')
  if (options.collapseBlankLines) {
    let previousBlank = false
    lines = lines.filter(line => { const blank = line.text.trim() === ''; const keep = !blank || !previousBlank; previousBlank = blank; return keep })
  }
  if (options.dedupeLines) {
    const seen = new Set<string>()
    lines = lines.filter(line => { if (seen.has(line.text)) return false; seen.add(line.text); return true })
  }
  const output = options.joinLines ? lines.map(line => line.text).join(' ') : lines.map((line, index) => line.text + (index < lines.length - 1 ? line.ending : '')).join('')
  return { output, before: textCounts(input), after: textCounts(output) }
}

// Textareas display CRLF/CR as LF. Map editing offsets back to the original text
// so unrelated line endings are preserved when pasting or editing.
export function rawTextOffset(raw: string, displayedOffset: number): number {
  let index = 0
  for (let displayed = 0; displayed < displayedOffset && index < raw.length; displayed++, index++) if (raw[index] === '\r' && raw[index + 1] === '\n') index++
  return index
}

export function applyDisplayedEdit(previous: string, displayed: string): string {
  const normalized = previous.replace(/\r\n|\r/g, '\n')
  let start = 0
  while (start < normalized.length && start < displayed.length && normalized[start] === displayed[start]) start++
  let end = normalized.length
  let newEnd = displayed.length
  while (end > start && newEnd > start && normalized[end - 1] === displayed[newEnd - 1]) { end--; newEnd-- }
  return previous.slice(0, rawTextOffset(previous, start)) + displayed.slice(start, newEnd) + previous.slice(rawTextOffset(previous, end))
}
