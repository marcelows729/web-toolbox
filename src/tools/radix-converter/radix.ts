export function convertRadix(input: string, radix: number): string {
  if (![2, 8, 10, 16].includes(radix)) throw new Error('入力基数を2・8・10・16から選択してください。')
  let digits = input.trim()
  const negative = digits.startsWith('-')
  if (/^[+-]/.test(digits)) digits = digits.slice(1)
  const prefix = /^(0[bBoOxX])/.exec(digits)?.[0]
  if (prefix) {
    const prefixRadix = { b: 2, o: 8, x: 16 }[prefix.charAt(1).toLowerCase()]
    if (prefixRadix !== radix) throw new Error('接頭辞と入力基数が一致しません。')
    digits = digits.slice(2)
  }
  if (!digits || digits.length > 4096) throw new Error('数字部分を1〜4096桁で入力してください。')
  const patterns: Record<number, RegExp> = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9a-f]+$/i }
  if (!patterns[radix]?.test(digits)) throw new Error('選択した基数で使えない桁が含まれています。小数・指数表記・桁区切りは使用できません。')
  const prefixes: Record<number, string> = { 2: '0b', 8: '0o', 10: '', 16: '0x' }
  const absolute = BigInt(`${prefixes[radix]}${digits}`)
  const value = negative ? -absolute : absolute
  return [2, 8, 10, 16].map(base => `${base}進数: ${value.toString(base)}`).join('\n')
}

