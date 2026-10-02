export const formatJson = (value: string) => {
  const parsed = JSON.parse(value)
  return JSON.stringify(parsed, null, 2)
}

export const minifyJson = (value: string) => {
  const parsed = JSON.parse(value)
  return JSON.stringify(parsed)
}
