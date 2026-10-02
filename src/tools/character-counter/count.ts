// Shared with CharacterCounter: grapheme clusters, falling back to code points.
export function getGraphemeLength(text: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      let count = 0
      for (const segment of segmenter.segment(text)) { void segment; count += 1 }
      return count
    } catch {
      // Keep the existing code-point fallback.
    }
  }
  return Array.from(text).length
}

export function countLines(text: string): number {
  if (!text) return 0
  let count = 1
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\r') { count += 1; if (text[i + 1] === '\n') i += 1 }
    else if (text[i] === '\n') count += 1
  }
  return count
}

export const textCounts = (text: string) => ({ characters: getGraphemeLength(text), lines: countLines(text) })
