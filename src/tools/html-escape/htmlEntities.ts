const escaped: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
const decoded: Record<number, string> = { 38: '&', 60: '<', 62: '>', 34: '"', 39: "'" }

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, character => escaped[character] ?? character)
}

export function unescapeHtml(input: string): string {
  // 一度の置換のみ。置換によって新しく現れた文字参照を再解釈しない。
  return input.replace(/&(?:amp|lt|gt|quot|apos|#[0-9]+|#[xX][0-9a-fA-F]+);/g, reference => {
    const body = reference.slice(1, -1)
    if (!body.startsWith('#')) return named[body] ?? reference
    const hexadecimal = /^#[xX]/.test(body)
    const code = Number.parseInt(body.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10)
    return decoded[code] ?? reference
  })
}

