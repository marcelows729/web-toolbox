export const FRACTION_LIMITS = { digits: 18, input: 32 } as const
export type Fraction = { numerator: bigint; denominator: bigint }
export type FractionOperation = 'add' | 'subtract' | 'multiply' | 'divide'
export type FractionValues = { firstNumerator: string; firstDenominator: string; secondNumerator: string; secondDenominator: string }
export type FractionResult = { first: Fraction; second: Fraction; value: Fraction; expression: string; exact: string; mixed: string | null }
export const FRACTION_OPERATIONS = [
  { value: 'add', label: '足す', symbol: '+' }, { value: 'subtract', label: '引く', symbol: '−' },
  { value: 'multiply', label: '掛ける', symbol: '×' }, { value: 'divide', label: '割る', symbol: '÷' },
] as const
export const initialFractions = (): FractionValues => ({ firstNumerator: '1', firstDenominator: '2', secondNumerator: '1', secondDenominator: '3' })
export function validateFractionInput(raw: string): void {
  if (raw.length > FRACTION_LIMITS.input) throw new Error('1つの入力欄は32文字までです。')
}
function integer(raw: string, label: string): bigint {
  validateFractionInput(raw)
  const value = raw.trim().replace(/[０-９＋－]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0)).replace(/−/g, '-')
  if (!/^[+-]?\d+$/.test(value)) throw new Error(`${label}を整数で入力してください。空欄・小数・カンマ・指数表記は使えません。`)
  if (value.replace(/^[+-]/, '').length > FRACTION_LIMITS.digits) throw new Error(`${label}は符号を除いて18桁以内にしてください。先頭の0も桁数に含みます。`)
  return BigInt(value)
}
const absolute = (value: bigint) => value < 0n ? -value : value
function reduced(numerator: bigint, denominator: bigint): Fraction {
  if (denominator === 0n) throw new Error('分母に0は使えません。')
  if (denominator < 0n) { numerator = -numerator; denominator = -denominator }
  let a = absolute(numerator), b = denominator
  while (b !== 0n) { const remainder = a % b; a = b; b = remainder }
  return { numerator: numerator / a, denominator: denominator / a }
}
const text = ({ numerator, denominator }: Fraction) => denominator === 1n ? numerator.toString() : `${numerator}/${denominator}`
const operand = (value: Fraction) => value.numerator < 0n ? `(${text(value)})` : text(value)
export function calculateFractions(values: FractionValues, operation: FractionOperation): FractionResult {
  const selected = FRACTION_OPERATIONS.find(item => item.value === operation)
  if (!selected) throw new Error('足す・引く・掛ける・割るから選んでください。')
  const first = reduced(integer(values.firstNumerator, '分数1の分子'), integer(values.firstDenominator, '分数1の分母'))
  const second = reduced(integer(values.secondNumerator, '分数2の分子'), integer(values.secondDenominator, '分数2の分母'))
  if (operation === 'divide' && second.numerator === 0n) throw new Error('0の分数では割れません。分数2の分子を0以外にしてください。')
  let numerator: bigint, denominator: bigint
  if (operation === 'add' || operation === 'subtract') {
    numerator = first.numerator * second.denominator + (operation === 'add' ? 1n : -1n) * second.numerator * first.denominator
    denominator = first.denominator * second.denominator
  } else if (operation === 'multiply') {
    numerator = first.numerator * second.numerator; denominator = first.denominator * second.denominator
  } else {
    numerator = first.numerator * second.denominator; denominator = first.denominator * second.numerator
  }
  const value = reduced(numerator, denominator), magnitude = absolute(value.numerator)
  const whole = magnitude / value.denominator, remainder = magnitude % value.denominator
  const mixed = whole > 0n && remainder > 0n ? `${value.numerator < 0n ? '−(' : ''}${whole} + ${remainder}/${value.denominator}${value.numerator < 0n ? ')' : ''}` : null
  return { first, second, value, expression: `${operand(first)} ${selected.symbol} ${operand(second)}`, exact: text(value), mixed }
}
export function fractionSummary(result: FractionResult): string {
  return `${result.expression} = ${result.exact}${result.mixed ? `\n帯分数：${result.mixed}` : ''}`
}
