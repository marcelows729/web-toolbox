export type UnitGroup = 'length' | 'mass' | 'volume' | 'area' | 'temperature'
export type Unit = { id: string; name: string; symbol: string; factor: number }
// International inch/foot/yard/mile and SI prefixes: NIST SP 811 Appendix B.
// Temperature: https://www.nist.gov/pml/owm/si-units-temperature
export const unitGroups: Record<UnitGroup, { name: string; units: Unit[] }> = {
  length: { name: '長さ', units: [
    { id: 'm', name: 'メートル', symbol: 'm', factor: 1 },
    { id: 'cm', name: 'センチメートル', symbol: 'cm', factor: 0.01 },
    { id: 'mm', name: 'ミリメートル', symbol: 'mm', factor: 0.001 },
    { id: 'km', name: 'キロメートル', symbol: 'km', factor: 1000 },
    { id: 'in', name: 'インチ', symbol: 'in', factor: 0.0254 },
    { id: 'ft', name: 'フィート（国際）', symbol: 'ft', factor: 0.3048 },
    { id: 'yd', name: 'ヤード（国際）', symbol: 'yd', factor: 0.9144 },
    { id: 'mi', name: 'マイル（国際）', symbol: 'mi', factor: 1609.344 },
  ] },
  mass: { name: '重さ', units: [
    { id: 'kg', name: 'キログラム', symbol: 'kg', factor: 1 },
    { id: 'g', name: 'グラム', symbol: 'g', factor: 0.001 },
    { id: 'mg', name: 'ミリグラム', symbol: 'mg', factor: 0.000001 },
    { id: 't', name: 'トン（1000 kg）', symbol: 't', factor: 1000 },
  ] },
  volume: { name: '体積', units: [
    { id: 'L', name: 'リットル', symbol: 'L', factor: 1 },
    { id: 'mL', name: 'ミリリットル', symbol: 'mL', factor: 0.001 },
    { id: 'm3', name: '立方メートル', symbol: 'm³', factor: 1000 },
    { id: 'cm3', name: '立方センチメートル', symbol: 'cm³', factor: 0.001 },
  ] },
  area: { name: '面積', units: [
    { id: 'm2', name: '平方メートル', symbol: 'm²', factor: 1 },
    { id: 'cm2', name: '平方センチメートル', symbol: 'cm²', factor: 0.0001 },
    { id: 'km2', name: '平方キロメートル', symbol: 'km²', factor: 1000000 },
    { id: 'ha', name: 'ヘクタール', symbol: 'ha', factor: 10000 },
  ] },
  temperature: { name: '温度', units: [
    { id: 'C', name: '摂氏', symbol: '°C', factor: 1 },
    { id: 'F', name: '華氏', symbol: '°F', factor: 1 },
    { id: 'K', name: 'ケルビン', symbol: 'K', factor: 1 },
  ] },
}

export function normalizeNumeric(text: string): string {
  return text.trim().replace(/[０-９＋－．Ｅｅ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0)).replace(/−/g, '-')
}
export function parseMeasurement(text: string): number {
  const value = normalizeNumeric(text)
  if (!value) throw new Error('変換する値を入力してください。')
  if (value.length > 100 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) throw new Error('数値を入力してください。カンマや単位は入力せず、小数点は「.」を使います。')
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error('大きすぎる値は変換できません。有限の数値を入力してください。')
  if (number === 0 && /[1-9]/.test(value.split(/[eE]/)[0])) throw new Error('小さすぎる値は正確に扱えません。値を大きくしてください。')
  return number === 0 ? 0 : number
}
export function convertMeasurement(value: number, group: UnitGroup, fromId: string, toId: string): number {
  const definition = unitGroups[group]
  const from = definition?.units.find(unit => unit.id === fromId)
  const to = definition?.units.find(unit => unit.id === toId)
  if (!from || !to || !Number.isFinite(value)) throw new Error('値と単位を確認してください。')
  if (group !== 'temperature' && value < 0) throw new Error('長さ・重さ・体積・面積は0以上で入力してください。')
  let output: number
  if (group === 'temperature') {
    const celsius = fromId === 'C' ? value : fromId === 'F' ? (value - 32) / 1.8 : value - 273.15
    if (value < (fromId === 'C' ? -273.15 : fromId === 'F' ? -459.67 : 0)) throw new Error('絶対零度（0 K / −273.15 °C / −459.67 °F）以上で入力してください。')
    output = fromId === toId ? value : toId === 'C' ? celsius : toId === 'F' ? celsius * 1.8 + 32 : celsius + 273.15
    if (toId === 'K' && value === (fromId === 'C' ? -273.15 : fromId === 'F' ? -459.67 : 0)) output = 0
  } else output = fromId === toId ? value : value * (from.factor / to.factor)
  if (!Number.isFinite(output)) throw new Error('換算結果が大きすぎます。値を小さくしてください。')
  if (output === 0 && value !== 0 && group !== 'temperature') throw new Error('換算結果が小さすぎます。別の単位を選んでください。')
  return output === 0 ? 0 : output
}
export function formatMeasurement(value: number): string {
  if (!Number.isFinite(value)) throw new Error('有限の数値を指定してください。')
  if (value === 0) return '0'
  const rounded = value.toPrecision(12)
  const number = Number(rounded)
  return Number.isFinite(number) ? number.toString() : rounded
}
