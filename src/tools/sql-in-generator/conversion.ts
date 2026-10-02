export type QuoteMode = 'string' | 'number'

const normalizeInput = (value: string): string[] =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

const escapeSqlString = (value: string) => value.replace(/'/g, "''")

const isValidSqlNumberLiteral = (value: string) => /^[-+]?(?:\d+\.\d+|\d+|\.\d+)$/.test(value)

export const buildSqlInList = (input: string, quoteMode: QuoteMode, removeDuplicates: boolean) => {
  const normalizedValues = normalizeInput(input)

  if (normalizedValues.length === 0) {
    return {
      output: '',
      error: '入力値がありません。値を入力してください。',
      count: null,
    }
  }

  const values = removeDuplicates ? Array.from(new Set(normalizedValues)) : normalizedValues

  if (quoteMode === 'number') {
    const invalidValues = values.filter((value) => !isValidSqlNumberLiteral(value))

    if (invalidValues.length > 0) {
      return {
        output: '',
        error: `数値として扱えない値があります: ${invalidValues.join(', ')}`,
        count: null,
      }
    }

    return {
      output: `(${values.join(', ')})`,
      error: '',
      count: values.length,
    }
  }

  return {
    output: `(${values.map((value) => `'${escapeSqlString(value)}'`).join(', ')})`,
    error: '',
    count: values.length,
  }
}
