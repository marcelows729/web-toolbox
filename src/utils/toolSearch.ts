import type { Tool, ToolCategory } from '../types/tool'
export function normalizeToolSearch(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60)).trim()
}
export function filterToolList(ordered: Tool[], query: string, category: 'all' | ToolCategory): Tool[] {
  const words = normalizeToolSearch(query).split(/\s+/).filter(Boolean)
  return ordered.filter(tool => {
    if (category !== 'all' && tool.category !== category) return false
    const text = normalizeToolSearch([tool.id, tool.name, tool.description, ...tool.keywords].join(' '))
    return words.every(word => text.includes(word))
  })
}
