import { tools } from '../tools/registry'

export const SHELF_KEY = 'poketsuru-tool-shelf-v1'
export const RECENT_LIMIT = 8
const knownIds = new Set(tools.map(tool => tool.id))
export type ToolShelf = { version: 1; favorites: string[]; recent: string[] }
export const emptyShelf = (): ToolShelf => ({ version: 1, favorites: [], recent: [] })

export function parseShelf(raw: string | null): ToolShelf {
  if (!raw || raw.length > 65536) return emptyShelf()
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1) return emptyShelf()
    const clean = (list: unknown, limit: number) => Array.isArray(list)
      ? [...new Set(list.filter((id): id is string => typeof id === 'string' && knownIds.has(id)))].slice(0, limit)
      : []
    return {
      version: 1,
      favorites: clean('favorites' in value ? value.favorites : null, tools.length),
      recent: clean('recent' in value ? value.recent : null, RECENT_LIMIT),
    }
  } catch { return emptyShelf() }
}

export type ShelfAction = { type: 'favorite' | 'visit'; id: string } | { type: 'clear-recent' }
export function updateShelf(shelf: ToolShelf, action: ShelfAction): ToolShelf {
  if (action.type === 'clear-recent') return shelf.recent.length ? { ...shelf, recent: [] } : shelf
  if (!knownIds.has(action.id)) return shelf
  if (action.type === 'favorite') {
    return { ...shelf, favorites: shelf.favorites.includes(action.id)
      ? shelf.favorites.filter(id => id !== action.id)
      : [action.id, ...shelf.favorites] }
  }
  if (shelf.recent[0] === action.id) return shelf
  return { ...shelf, recent: [action.id, ...shelf.recent.filter(id => id !== action.id)].slice(0, RECENT_LIMIT) }
}

type ShelfStorage = Pick<Storage, 'getItem' | 'setItem'>
export function loadShelf(storage: ShelfStorage): { shelf: ToolShelf; unavailable: boolean } {
  try { return { shelf: parseShelf(storage.getItem(SHELF_KEY)), unavailable: false } }
  catch { return { shelf: emptyShelf(), unavailable: true } }
}
export function saveShelf(storage: ShelfStorage, shelf: ToolShelf): boolean {
  try { storage.setItem(SHELF_KEY, JSON.stringify(shelf)); return true }
  catch { return false }
}
