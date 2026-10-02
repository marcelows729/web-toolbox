import { compareFractions, formatFraction, parseAmount, shortText } from '../everyday-calculations/decimal'
import type { Fraction } from '../everyday-calculations/decimal'

export const PRICE_UNITS = ['g', 'kg', 'mL', 'L', '個'] as const
export type PriceUnit = typeof PRICE_UNITS[number]
export type ProductInput = { name: string; price: string; amount: string; unit: PriceUnit }
export type PriceBasis = 'standard' | 'large'
export type PriceComparison = { basis: string; products: Array<{ name: string; price: string; amount: string; unit: PriceUnit; unitPrice: string; status: string }> }
const dimensions: Record<PriceUnit, 'mass' | 'volume' | 'count'> = { g: 'mass', kg: 'mass', mL: 'volume', L: 'volume', '個': 'count' }

export function comparePrices(inputs: ProductInput[], basis: PriceBasis): PriceComparison {
  if (inputs.length < 2 || inputs.length > 4) throw new Error('商品は2〜4件で比較してください。')
  if (basis !== 'standard' && basis !== 'large') throw new Error('比較する基準量を選んでください。')
  const dimension = dimensions[inputs[0].unit]
  if (!dimension || inputs.some(input => !Object.hasOwn(dimensions, input.unit))) throw new Error('単位を確認してください。')
  if (inputs.some(input => dimensions[input.unit] !== dimension)) throw new Error('重さ・体積・個数は別々に比較してください。gとkg、mLとLはそれぞれ混ぜて使えます。')
  const baseline = dimension === 'count' ? (basis === 'standard' ? 1n : 10n) : (basis === 'standard' ? 100n : 1000n)
  const label = `${baseline}${dimension === 'mass' ? 'g' : dimension === 'volume' ? 'mL' : '個'}`
  const calculated = inputs.map((input, index) => {
    const name = shortText(input.name, `商品${index + 1}の名前`, 80) || `商品${index + 1}`
    const price = parseAmount(input.price, `${name}の購入価格`)
    const amount = parseAmount(input.amount, `${name}の内容量・個数`, 1_000_000_000, true)
    const factor = input.unit === 'kg' || input.unit === 'L' ? 1000n : 1n
    const unitPrice: Fraction = { numerator: price.numerator * amount.denominator * baseline, denominator: price.denominator * amount.numerator * factor }
    return { name, price: formatFraction(price, 6), amount: formatFraction(amount, 6), unit: input.unit, exact: unitPrice }
  })
  const cheapest = calculated.reduce((best, item) => compareFractions(item.exact, best) < 0 ? item.exact : best, calculated[0].exact)
  const winnerCount = calculated.filter(item => compareFractions(item.exact, cheapest) === 0).length
  return { basis: label, products: calculated.map((item, index) => ({ name: item.name, price: item.price, amount: item.amount, unit: item.unit, unitPrice: formatFraction(item.exact, 2), status: compareFractions(item.exact, cheapest) === 0 ? winnerCount > 1 ? '最安（同値）' : '最安' : calculated.some((other, j) => j !== index && compareFractions(item.exact, other.exact) === 0) ? '同値' : '' })) }
}

export function priceSummary(result: PriceComparison): string {
  return [`単価比較（${result.basis}あたり）`, ...result.products.map(item => `${item.name}：${item.unitPrice}円${item.status ? ` / ${item.status}` : ''}（購入価格${item.price}円、${item.amount}${item.unit}）`), '表示は小数2桁まで四捨五入。最安・同値の判定は丸める前の単価で行います。'].join('\n')
}
