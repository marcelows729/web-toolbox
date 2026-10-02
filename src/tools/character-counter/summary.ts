import { countLines, getGraphemeLength } from './count'
export const MAX_COUNTER_UNITS = 50_000
export function validateCounterInput(text: string): void {
  if (text.length > MAX_COUNTER_UNITS) throw new Error('入力は50,000文字相当（UTF-16単位）までです。超える入力は切り捨てずに受け付けません。')
}
export const normalizeCounterLines = (text: string) => text.replace(/\r\n?/g, '\n')
export function counterSummary(text: string) {
  validateCounterInput(text)
  const trimmed = text.trim()
  return {
    totalCharacters: getGraphemeLength(text),
    withoutWhitespace: getGraphemeLength(text.replace(/[\s\u3000\t\n\r]/g, '')),
    withoutNewlines: getGraphemeLength(text.replace(/\r\n|\r|\n/g, '')),
    lines: countLines(text),
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    utf8Bytes: new TextEncoder().encode(text).length,
  }
}
