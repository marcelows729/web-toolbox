export type EncodeMode = 'component' | 'full-url'

export const getEncodedValue = (text: string, mode: EncodeMode) =>
  mode === 'component' ? encodeURIComponent(text) : encodeURI(text)

export const getDecodedValue = (text: string, mode: EncodeMode) => {
  if (mode === 'component') {
    return decodeURIComponent(text)
  }

  return decodeURI(text)
}

export const getEmptyStateError = (action: 'encode' | 'decode') => {
  if (action === 'encode') {
    return '入力が空のため、エンコード結果はありません。'
  }

  return '入力が空のため、デコード結果はありません。'
}
