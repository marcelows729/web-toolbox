import { formatFraction, parseAmount } from '../everyday-calculations/decimal'
import type { Fraction } from '../everyday-calculations/decimal'
export const MAX_DIMENSION = 1_000_000
export type AspectAxis = 'width' | 'height'
export type AspectRounding = 'round' | 'ceil' | 'floor' | 'decimal'
export const ASPECT_PRESETS = [['1', '1'], ['4', '3'], ['3', '2'], ['16', '9'], ['9', '16']] as const
const gcd = (a: bigint, b: bigint): bigint => { while (b) { const remainder = a % b; a = b; b = remainder } return a }
const ratio = (width: Fraction, height: Fraction): string => {
  const a = width.numerator * height.denominator, b = height.numerator * width.denominator, divisor = gcd(a, b)
  return `${a / divisor}:${b / divisor}`
}
const approximate = (value: Fraction): string => {
  const display = formatFraction(value, 6)
  return value.numerator * 1_000_000n % value.denominator && !display.includes('未満') ? `約${display}` : display
}
export function calculateAspect(widthText: string, heightText: string, axis: AspectAxis, targetText: string, rounding: AspectRounding) {
  if (axis !== 'width' && axis !== 'height') throw new Error('指定する寸法を確認してください。')
  if (!['round', 'ceil', 'floor', 'decimal'].includes(rounding)) throw new Error('丸め方を確認してください。')
  const width = parseAmount(widthText, '元の幅', MAX_DIMENSION, true), height = parseAmount(heightText, '元の高さ', MAX_DIMENSION, true)
  const original = { ratio: ratio(width, height), width: formatFraction(width, 6), height: formatFraction(height, 6) }
  if (!targetText.trim()) return { original, size: null }
  const target = parseAmount(targetText, '新しい寸法', MAX_DIMENSION, true)
  const from = axis === 'width' ? width : height, other = axis === 'width' ? height : width
  const ideal: Fraction = { numerator: target.numerator * other.numerator * from.denominator, denominator: target.denominator * other.denominator * from.numerator }
  if (ideal.numerator > BigInt(MAX_DIMENSION) * ideal.denominator) throw new Error('計算する側の寸法が1,000,000を超えます。新しい寸法を小さくしてください。')
  let rounded = ideal.numerator / ideal.denominator
  if (rounding === 'round') rounded = (ideal.numerator * 2n + ideal.denominator) / (ideal.denominator * 2n)
  if (rounding === 'ceil' && ideal.numerator % ideal.denominator) rounded++
  if (rounding !== 'decimal' && rounded === 0n) throw new Error('丸め後の寸法が0になります。新しい寸法を大きくするか、小数表示・切り上げを選んでください。')
  const counterpart = rounding === 'decimal' ? approximate(ideal) : rounded.toString()
  const finalOther = { numerator: rounded, denominator: 1n }
  return { original, size: {
    width: axis === 'width' ? formatFraction(target, 6) : counterpart,
    height: axis === 'height' ? formatFraction(target, 6) : counterpart,
    axis, rounding, idealOther: approximate(ideal),
    changed: rounding !== 'decimal' && rounded * ideal.denominator !== ideal.numerator,
    ratioAfter: rounding === 'decimal' ? null : axis === 'width' ? ratio(target, finalOther) : ratio(finalOther, target),
  } }
}
export type AspectResult = ReturnType<typeof calculateAspect>
export function aspectSummary(result: AspectResult): string {
  const lines = [`縦横比・サイズ計算`, `元の寸法：${result.original.width} × ${result.original.height}`, `元の比率（幅:高さ）：${result.original.ratio}`]
  if (result.size) {
    const size = result.size
    lines.push(`新しい寸法（幅 × 高さ）：${size.width} × ${size.height}`, `計算する${size.axis === 'width' ? '高さ' : '幅'}の丸め：${{round:'四捨五入',ceil:'切り上げ',floor:'切り捨て',decimal:'小数6桁の目安'}[size.rounding]}`)
    if (size.ratioAfter) lines.push(`表示寸法の比率：${size.ratioAfter}`, size.changed ? '丸めにより元の比率と差があります。' : '元の比率を維持しています。')
    else lines.push('小数は表示上の目安です。内部では元の比率を維持して計算しています。')
  }
  lines.push('幅と高さの単位を揃えてください。dpi・印刷実寸の換算や保証はしません。')
  return lines.join('\n')
}
