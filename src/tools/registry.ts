import type { Tool } from '../types/tool'

export const tools: Tool[] = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'JSONを整形・圧縮します。',
    category: 'developer',
    keywords: ['json', 'format', 'formatter', '整形', '圧縮'],
    path: '/tools/json-formatter',
    relatedTools: ['sql-in-generator'],
  },
  {
    id: 'sql-in-generator',
    name: 'SQL IN Generator',
    description: '値の一覧からSQLのIN句を生成します。',
    category: 'developer',
    keywords: ['sql', 'in', 'generator', 'in句', 'sql生成', 'リスト'],
    path: '/tools/sql-in-generator',
    relatedTools: ['json-formatter'],
  },
]
