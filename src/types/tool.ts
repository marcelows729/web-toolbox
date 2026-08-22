export type ToolCategory = 'developer' | 'text' | 'datetime' | 'network' | 'other'

export type Tool = {
  id: string
  name: string
  description: string
  category: ToolCategory
  keywords: string[]
  path: string
  relatedTools?: string[]
}

export const categoryLabels: Record<ToolCategory, string> = {
  developer: '開発',
  text: 'テキスト・変換',
  datetime: '日時',
  network: 'ネットワーク',
  other: 'その他',
}
