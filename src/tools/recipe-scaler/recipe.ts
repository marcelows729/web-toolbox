import { formatFraction, parseAmount, shortText } from '../everyday-calculations/decimal'
import type { Fraction } from '../everyday-calculations/decimal'

export type IngredientInput = { name: string; amount: string; unit: string }
export type RecipeScale = { mode: 'people' | 'factor'; original: string; target: string; factor: string }
export type RecipeResult = { scale: string; ingredients: Array<{ name: string; amount: string; unit: string }> }

export function scaleRecipe(inputs: IngredientInput[], settings: RecipeScale, places: number): RecipeResult {
  if (inputs.length < 1 || inputs.length > 20) throw new Error('材料は1〜20行で入力してください。')
  if (!Number.isInteger(places) || places < 0 || places > 6) throw new Error('表示小数桁数を0〜6から選んでください。')
  let multiplier: Fraction
  let scale: string
  if (settings.mode === 'people') {
    const original = parseAmount(settings.original, '元の人数', 10_000, true)
    const target = parseAmount(settings.target, '作る人数', 10_000, true)
    multiplier = { numerator: target.numerator * original.denominator, denominator: target.denominator * original.numerator }
    scale = `${formatFraction(original, 6)}人分 → ${formatFraction(target, 6)}人分`
  } else if (settings.mode === 'factor') {
    multiplier = parseAmount(settings.factor, '倍率', 10_000, true)
    scale = `${formatFraction(multiplier, 6)}倍`
  } else throw new Error('人数か倍率を選んでください。')
  if (multiplier.numerator > multiplier.denominator * 10_000n) throw new Error('調整倍率は10,000倍以下にしてください。')
  const ingredients = inputs.map((input, index) => {
    const name = shortText(input.name, `材料${index + 1}の名前`, 80, true)
    const unit = shortText(input.unit, `${name}の単位`, 20)
    const raw = input.amount.trim()
    if (raw === '適量' || raw === '少々') return { name, amount: raw, unit }
    const amount = parseAmount(input.amount, `${name}の量`)
    const scaled = { numerator: amount.numerator * multiplier.numerator, denominator: amount.denominator * multiplier.denominator }
    if (scaled.numerator > scaled.denominator * 1_000_000_000_000n) throw new Error(`${name}の調整後の量が大きすぎます。1兆以下にしてください。`)
    return { name, amount: formatFraction(scaled, places), unit }
  })
  return { scale, ingredients }
}

export function recipeSummary(result: RecipeResult): string {
  return [`レシピ分量調整（${result.scale}）`, ...result.ingredients.map(item => `${item.name}：${item.amount}${item.unit ? ` ${item.unit}` : ''}`), '分量の目安です。調理時間や味は同じ割合で変わるとは限りません。'].join('\n')
}
