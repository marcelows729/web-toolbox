export const toBase64 = (text: string) => {
  const bytes = new TextEncoder().encode(text)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

export const fromBase64 = (base64Text: string) => {
  const normalized = base64Text.replace(/\s+/g, '')
  const binary = atob(normalized)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

export const getEmptyStateError = (action: 'encode' | 'decode') => {
  if (action === 'encode') {
    return '入力が空のため、エンコード結果はありません。'
  }

  return '入力が空のため、デコード結果はありません。'
}
