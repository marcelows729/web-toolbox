export function parseCandidates(text: string): string[] {
  if (text.length > 20480) throw new Error('入力が長すぎます。候補は20件までにしてください。')
  const labels = text.split(/\r\n|\r|\n/).map(label => label.trim().normalize('NFC')).filter(Boolean)
  if (labels.length < 2 || labels.length > 20) throw new Error('空行を除いて、2〜20候補を1行ずつ入力してください。')
  if (labels.some(label => [...label].length > 50)) throw new Error('1候補は50文字までにしてください。')
  if (new Set(labels).size !== labels.length) throw new Error('同じ候補が重複しています。候補を別の名前にしてください。')
  return labels
}
export function remainingCandidates(candidates: string[], selected: string[], exclude: boolean): string[] {
  return exclude ? candidates.filter(label => !selected.includes(label)) : candidates
}
function secureUint32(): number {
  if (!globalThis.crypto?.getRandomValues) throw new Error('このブラウザでは安全な抽選を利用できません。対応するブラウザで開いてください。')
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
}
// Rejection sampling makes every residue equally likely; no Math.random fallback.
export function uniformIndex(size: number, random: () => number = secureUint32): number {
  if (!Number.isInteger(size) || size < 1 || size > 20) throw new Error('抽選できる候補がありません。')
  const range = 2 ** 32
  const limit = range - range % size
  for (let attempt = 0; attempt < 128; attempt += 1) {
    const value = random()
    if (!Number.isInteger(value) || value < 0 || value >= range) throw new Error('乱数の生成に失敗しました。')
    if (value < limit) return value % size
  }
  throw new Error('乱数の生成に失敗しました。もう一度抽選してください。')
}
export function wheelRotation(current: number, index: number, size: number): number {
  const target = (360 - (index + 0.5) * 360 / size) % 360
  return current + 1800 + (target - current % 360 + 360) % 360
}
