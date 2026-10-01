export type PercentageMode = 'ratio' | 'portion' | 'change'
type Decimal = { coefficient: bigint; scale: bigint }

function parseDecimal(input: string): Decimal {
  const value = input.trim()
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value)) {
    throw new Error('10進数を入力してください。指数表記・桁区切り・末尾だけの小数点は使用できません。')
  }
  const unsigned = value.replace(/^[+-]/, '')
  const [integer = '', fraction = ''] = unsigned.split('.')
  if (integer.length + fraction.length > 100 || fraction.length > 20) {
    throw new Error('各入力は数字100桁以内、小数部20桁以内にしてください。')
  }
  const coefficient = BigInt(`${integer || '0'}${fraction}`) * BigInt(value.startsWith('-') ? -1 : 1)
  return { coefficient, scale: BigInt(10) ** BigInt(fraction.length) }
}

function roundFraction(numerator: bigint, denominator: bigint, places: number): string {
  if (denominator === BigInt(0)) throw new Error('分母（全体または変更前の値）が0のため計算できません。')
  const negative = (numerator < BigInt(0)) !== (denominator < BigInt(0))
  const absoluteNumerator = numerator < BigInt(0) ? -numerator : numerator
  const absoluteDenominator = denominator < BigInt(0) ? -denominator : denominator
  const scaled = absoluteNumerator * BigInt(10) ** BigInt(places)
  let rounded = scaled / absoluteDenominator
  if ((scaled % absoluteDenominator) * BigInt(2) >= absoluteDenominator) rounded += BigInt(1)
  const digits = rounded.toString().padStart(places + 1, '0')
  const body = places === 0 ? digits : `${digits.slice(0, -places)}.${digits.slice(-places)}`
  return `${negative && rounded !== BigInt(0) ? '-' : ''}${body}`
}

export function calculatePercentage(mode: PercentageMode, first: string, second: string, places: number): string {
  if (!Number.isInteger(places) || places < 0 || places > 10) throw new Error('表示小数桁数を0〜10から選択してください。')
  const a = parseDecimal(first)
  const b = parseDecimal(second)
  const hundred = BigInt(100)
  switch (mode) {
    case 'ratio':
      return `${roundFraction(a.coefficient * b.scale * hundred, b.coefficient * a.scale, places)}%`
    case 'portion':
      return roundFraction(a.coefficient * b.coefficient, a.scale * b.scale * hundred, places)
    case 'change':
      return `${roundFraction((b.coefficient * a.scale - a.coefficient * b.scale) * hundred, a.coefficient * b.scale, places)}%`
    default:
      throw new Error('計算方法を選択してください。')
  }
}
