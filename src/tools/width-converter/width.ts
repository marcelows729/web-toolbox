export const MAX_WIDTH_UNITS = 50_000
export type WidthDirection = 'half' | 'full'
export const WIDTH_TARGETS = [
  { id: 'letters', label: '英字', detail: 'A〜Z、a〜zと対応する全角英字。' },
  { id: 'digits', label: '数字', detail: '0〜9と対応する全角数字。' },
  { id: 'symbols', label: 'ASCII記号', detail: '!、@、括弧、~などのASCII記号と対応する全角形。' },
  { id: 'spaces', label: 'スペース', detail: '半角スペースと全角スペース。タブ・改行は変えません。' },
] as const
export type WidthTargets = Record<typeof WIDTH_TARGETS[number]['id'], boolean>
export const defaultWidthTargets = (): WidthTargets => ({ letters: true, digits: true, symbols: false, spaces: false })
export function validateWidthInput(input: string): void {
  if (input.length > MAX_WIDTH_UNITS) throw new Error('入力は50,000文字相当（UTF-16単位）までです。超える入力は切り捨てずに受け付けません。')
}
export function convertWidth(input: string, direction: WidthDirection, targets: WidthTargets) {
  validateWidthInput(input)
  if (direction !== 'half' && direction !== 'full') throw new Error('変換方向を確認してください。')
  for (const {id} of WIDTH_TARGETS) if (typeof targets[id] !== 'boolean') throw new Error('変換する対象を確認してください。')
  const output: string[] = []
  let changed = 0
  for (let offset = 0; offset < input.length;) {
    // ASCII digits/#/* can belong to keycap emoji. Keep the entire sequence intact.
    const base = input[offset], following = input[offset + 1]
    const keycapBase = (base >= '0' && base <= '9') || base === '#' || base === '*'
    const keycapLength = keycapBase && following === '\u20e3' ? 2 : keycapBase && (following === '\ufe0f' || following === '\ufe0e') && input[offset + 2] === '\u20e3' ? 3 : 0
    if (keycapLength) { output.push(input.slice(offset, offset + keycapLength)); offset += keycapLength; continue }
    const character = String.fromCodePoint(input.codePointAt(offset)!)
    offset += character.length
    const code = character.codePointAt(0)!
    let next = character
    if (targets.spaces && code === (direction === 'half' ? 0x3000 : 0x20)) next = direction === 'half' ? ' ' : '　'
    else {
      const ascii = direction === 'half' ? code - 0xfee0 : code
      if (ascii >= 0x21 && ascii <= 0x7e) {
        const letter = (ascii >= 0x41 && ascii <= 0x5a) || (ascii >= 0x61 && ascii <= 0x7a)
        const digit = ascii >= 0x30 && ascii <= 0x39
        if (letter ? targets.letters : digit ? targets.digits : targets.symbols) next = String.fromCharCode(direction === 'half' ? ascii : ascii + 0xfee0)
      }
    }
    if (next !== character) changed++
    output.push(next)
  }
  // Every mapping is one BMP character to one BMP character: output cannot amplify.
  return { output: output.join(''), changed }
}
