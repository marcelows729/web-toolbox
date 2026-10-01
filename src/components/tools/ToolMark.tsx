import type { Tool } from '../../types/tool'

const marks: Record<string, string> = {
  'holiday-style': '☀', 'pocket-companion': '✦',
  'unit-converter': '↔', 'bill-splitter': '¥', 'roulette-picker': '◎',
  'json-formatter': '{ }', 'sql-in-generator': 'IN', 'timestamp-converter': '01:',
  'character-counter': 'Aa', 'url-encode-decode': '%', 'base64-encode-decode': '64',
  'uuid-generator': '#', 'date-calculator': '31', 'japanese-era-converter': '暦',
  'qr-code-generator': '▦', 'text-diff': '±', 'ipv4-cidr': '/24', 'sha256': 'SHA',
  'radix-converter': '0x', 'html-escape': '</>', 'percentage-calculator': '%',
}
export default function ToolMark({ tool }: { tool: Tool }) {
  return <span className={`tool-mark tool-mark--${tool.category}`} aria-hidden="true">{marks[tool.id] ?? '↗'}</span>
}
