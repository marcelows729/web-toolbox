export type Fraction = { numerator: bigint; denominator: bigint }

// Bounded decimal input and integer arithmetic keep prices, ties and rounding exact.
export function parseAmount(text: string, label: string, max = 1_000_000_000, positive = false): Fraction {
  const normalized = text.trim().replace(/[０-９＋．]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
  if (normalized.length > 32 || !/^\+?(?:\d+(?:\.\d{1,6})?|\.\d{1,6})$/.test(normalized)) {
    throw new Error(`${label}は小数6桁までの数値で入力してください。カンマ・指数表記・分数は使えません。`)
  }
  const [integer, fraction = ''] = normalized.replace(/^\+/, '').split('.')
  const numerator = BigInt(`${integer || '0'}${fraction}`)
  const denominator = 10n ** BigInt(fraction.length)
  if (numerator > BigInt(max) * denominator || (positive && numerator === 0n)) {
    throw new Error(`${label}は${positive ? '0より大きく' : '0以上'}、${max.toLocaleString('ja-JP')}以下で入力してください。`)
  }
  return { numerator, denominator }
}

export function formatFraction(value: Fraction, places: number): string {
  if (!Number.isInteger(places) || places < 0 || places > 6 || value.denominator <= 0n || value.numerator < 0n) throw new Error('表示する値と小数桁数を確認してください。')
  const scale = 10n ** BigInt(places)
  const scaled = value.numerator * scale
  const rounded = (scaled + value.denominator / 2n) / value.denominator
  if (rounded === 0n && value.numerator > 0n) return `${places ? `0.${'0'.repeat(places - 1)}1` : '1'}未満`
  const digits = rounded.toString().padStart(places + 1, '0')
  return places ? `${digits.slice(0, -places)}.${digits.slice(-places)}`.replace(/\.?0+$/, '') : digits
}

export const compareFractions = (a: Fraction, b: Fraction): number => {
  const difference = a.numerator * b.denominator - b.numerator * a.denominator
  return difference < 0n ? -1 : difference > 0n ? 1 : 0
}

export function shortText(text: string, label: string, max: number, required = false): string {
  const value = text.trim()
  if ((required && !value) || value.length > max || [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) throw new Error(`${label}は${required ? '1' : '0'}〜${max}文字の1行で入力してください。`)
  return value
}
