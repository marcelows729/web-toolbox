export const MAX_CANDIDATES = 100
export const MAX_NAME_CHARACTERS = 100
export const MAX_INPUT_UNITS = 30000
export type Participant = { id: number; name: string }
export type GroupingResult = { groups: Participant[][]; total: number; duplicateNames: string[] }
export function parseParticipants(text: string) {
  if (text.length > MAX_INPUT_UNITS) throw new Error('入力全体は30,000文字相当までです。超える入力は受け付けません。')
  const names = text.split(/\r\n|\r|\n/).map(name => name.trim()).filter(Boolean)
  if (names.length < 2 || names.length > MAX_CANDIDATES) throw new Error('空行を除いて2〜100候補を、1行に1人・1件ずつ入力してください。')
  if (names.some(name => [...name].length > MAX_NAME_CHARACTERS)) throw new Error('1候補は100文字までです。絵文字などは複数文字と数える場合があります。')
  const seen = new Set<string>(), duplicates = new Set<string>()
  names.forEach(name => { if (seen.has(name)) duplicates.add(name); seen.add(name) })
  return { participants: names.map((name, index) => ({ id: index + 1, name })), duplicateNames: [...duplicates] }
}
export function parseGroupCount(raw: string, total: number): number {
  const value = raw.trim().replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
  if (!/^\d{1,3}$/.test(value) || Number(value) < 2 || Number(value) > total) throw new Error('組数は2〜' + total + 'の整数で入力してください。')
  return Number(value)
}
function secureUint32(): number {
  if (!globalThis.crypto?.getRandomValues) throw new Error('このブラウザでは安全な組み分けを利用できません。対応するブラウザで開いてください。')
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
}
// Reject the incomplete residue range before Fisher-Yates chooses an index.
export function uniformGroupIndex(size: number, random: () => number = secureUint32): number {
  if (!Number.isInteger(size) || size < 1 || size > MAX_CANDIDATES) throw new Error('組み分けの範囲が正しくありません。')
  const range = 2 ** 32, limit = range - range % size
  for (let attempt = 0; attempt < 128; attempt++) {
    const value = random()
    if (!Number.isInteger(value) || value < 0 || value >= range) throw new Error('乱数の生成に失敗しました。')
    if (value < limit) return value % size
  }
  throw new Error('乱数の生成に失敗しました。もう一度組み分けしてください。')
}
export function createGroups(text: string, rawCount: string, random?: () => number): GroupingResult {
  const { participants, duplicateNames } = parseParticipants(text)
  const count = parseGroupCount(rawCount, participants.length)
  const shuffled = [...participants]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = uniformGroupIndex(i + 1, random)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const base = Math.floor(shuffled.length / count), extra = shuffled.length % count
  let offset = 0
  const groups = Array.from({ length: count }, (_, index) => {
    const size = base + (index < extra ? 1 : 0)
    const group = shuffled.slice(offset, offset + size)
    offset += size
    return group
  })
  return { groups, total: participants.length, duplicateNames }
}
export function groupingSummary(result: GroupingResult): string {
  return ['ランダム組み分け', result.total + '候補 / ' + result.groups.length + '組',
    ...(result.duplicateNames.length ? ['同名の候補も入力順の番号で区別しています。'] : []),
    ...result.groups.flatMap((group, index) => ['', '組' + (index + 1) + '（' + group.length + '候補）', ...group.map(person => '候補' + person.id + ': ' + person.name)])].join('\n')
}
