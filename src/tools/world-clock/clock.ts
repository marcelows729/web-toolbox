export const WORLD_CITIES = [
  { id: 'tokyo', name: '東京', region: '日本', zone: 'Asia/Tokyo', fixed: true },
  { id: 'utc', name: 'UTC', region: '協定世界時', zone: 'UTC', fixed: true },
  { id: 'new-york', name: 'ニューヨーク', region: '米国', zone: 'America/New_York', fixed: false },
  { id: 'los-angeles', name: 'ロサンゼルス', region: '米国', zone: 'America/Los_Angeles', fixed: false },
  { id: 'london', name: 'ロンドン', region: '英国', zone: 'Europe/London', fixed: false },
  { id: 'paris', name: 'パリ', region: 'フランス', zone: 'Europe/Paris', fixed: false },
  { id: 'sydney', name: 'シドニー', region: 'オーストラリア', zone: 'Australia/Sydney', fixed: false },
] as const
export const MAX_WORLD_CITIES = 6
export const initialWorldCities = (): string[] => ['tokyo', 'utc', 'new-york', 'london']
type WorldCity = typeof WORLD_CITIES[number]
export type WorldClockRow = { city: WorldCity; date: string; weekday: string; time: string; offset: string }
export type WorldClockSnapshot = { instant: string; rows: WorldClockRow[] }
const formatters = new Map<string, Intl.DateTimeFormat>()
function city(id: string): WorldCity {
  const found = WORLD_CITIES.find(item => item.id === id)
  if (!found) throw new Error('表示する都市を一覧から選んでください。')
  return found
}
function validateCities(ids: string[]): void {
  if (ids.length < 2 || ids.length > MAX_WORLD_CITIES || ids[0] !== 'tokyo' || ids[1] !== 'utc') throw new Error('東京・UTCを基準に、最大6つまで表示できます。')
  if (new Set(ids).size !== ids.length) throw new Error('同じ都市は追加できません。')
  ids.forEach(city)
}
export function addWorldCity(ids: string[], id: string): string[] {
  validateCities(ids); city(id)
  if (ids.includes(id)) throw new Error('同じ都市は追加できません。')
  if (ids.length >= MAX_WORLD_CITIES) throw new Error('最大6つまでです。追加するには都市を外してください。')
  return [...ids, id]
}
export function removeWorldCity(ids: string[], id: string): string[] {
  validateCities(ids)
  if (city(id).fixed) throw new Error('基準の東京・UTCは外せません。')
  if (!ids.includes(id)) throw new Error('表示中の都市を選んでください。')
  return ids.filter(value => value !== id)
}
function formatRow(selected: WorldCity, instant: Date): WorldClockRow {
  let formatter = formatters.get(selected.id)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('ja-JP', { timeZone: selected.zone, calendar: 'gregory', numberingSystem: 'latn', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZoneName: 'longOffset' })
    formatters.set(selected.id, formatter)
  }
  const parts = formatter.formatToParts(instant)
  const part = (name: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find(item => item.type === name)?.value
    if (!value) throw new Error('このブラウザでは地域の時刻情報を表示できません。')
    return value
  }
  const offsetName = part('timeZoneName').replace(/^GMT/, 'UTC').replace(/−/g, '-')
  if (!/^UTC(?:[+-]\d{2}:\d{2}(?::\d{2})?)?$/.test(offsetName)) throw new Error('このブラウザではUTCオフセットを表示できません。')
  return { city: selected, date: `${part('year').padStart(4, '0')}-${part('month')}-${part('day')}`, weekday: part('weekday'), time: `${part('hour')}:${part('minute')}:${part('second')}`, offset: offsetName === 'UTC' ? 'UTC+00:00' : offsetName }
}
export function worldClockSnapshot(ids: string[], now: number): WorldClockSnapshot {
  validateCities(ids)
  const instant = new Date(now)
  if (!Number.isFinite(now) || !Number.isFinite(instant.getTime())) throw new Error('端末の時計を確認してください。')
  return { instant: instant.toISOString(), rows: ids.map(id => formatRow(city(id), instant)) }
}
export function worldClockText(snapshot: WorldClockSnapshot): string {
  return `世界時計（端末時計・コピー時点）\nUTC基準：${snapshot.instant}\n` + snapshot.rows.map(row => `${row.city.name}（${row.city.region}）：${row.date}（${row.weekday}） ${row.time} ${row.offset}`).join('\n')
}
