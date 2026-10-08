export type Period = 'daily' | 'weekly'
export type Task = { id: string; title: string; period: Period; done: boolean }
export type Character = { id: string; name: string; tasks: Task[] }
export type Checklist = { version: 1; characters: Character[] }
export const STORAGE_KEY = 'poketsuru-aion2-checklist-v1'
export const CONFLICT_WARNING = '保存内容が別の画面で変更されました。この画面の変更は保存していません。必要ならJSONを書き出してから再読込してください。'
export const MAX_JSON_BYTES = 1_048_576
export const emptyChecklist = (): Checklist => ({ version: 1, characters: [] })
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
export function checkedText(value: unknown, label: string, maximum: number): string {
  if (typeof value !== 'string' || !value.trim()) throw Error(`${label}を入力してください。`)
  if (value.length > maximum || [...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) throw Error(`${label}は${maximum}文字相当以内、改行なしで入力してください。`)
  return value.trim()
}
export function validateChecklist(value: unknown): Checklist {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.characters)) throw Error('対応するチェック表のJSON（version: 1）ではありません。')
  if (value.characters.length > 20) throw Error('キャラクターは20人までです。')
  const ids = new Set<string>(); let total = 0
  const id = (value: unknown) => { if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(value) || ids.has(value)) throw Error('IDが不正、または重複しています。'); ids.add(value); return value }
  const characters = value.characters.map(raw => {
    if (!object(raw) || !Array.isArray(raw.tasks)) throw Error('キャラクターとタスクの形式を確認してください。')
    if (raw.tasks.length > 100 || (total += raw.tasks.length) > 1000) throw Error('タスクは1人100件、全体1,000件までです。')
    return { id: id(raw.id), name: checkedText(raw.name, 'キャラクター名', 40), tasks: raw.tasks.map((rawTask): Task => {
      if (!object(rawTask) || (rawTask.period !== 'daily' && rawTask.period !== 'weekly') || typeof rawTask.done !== 'boolean') throw Error('タスクの区分・完了状態が不正です。')
      return { id: id(rawTask.id), title: checkedText(rawTask.title, 'やること', 120), period: rawTask.period, done: rawTask.done }
    }) }
  })
  return { version: 1, characters }
}
export function decodeChecklist(text: string): Checklist {
  if (new TextEncoder().encode(text).length > MAX_JSON_BYTES) throw Error('JSONは1 MiBまでです。')
  let value: unknown; try { value = JSON.parse(text) } catch { throw Error('JSONを読み取れません。ファイルの内容を確認してください。') }
  return validateChecklist(value)
}
export const encodeChecklist = (data: Checklist) => JSON.stringify(validateChecklist(data), null, 2) + '\n'
export const taskProgress = (character: Character, period: Period) => { const tasks = character.tasks.filter(task => task.period === period); return { total: tasks.length, done: tasks.filter(task => task.done).length } }
export const resetTasks = (character: Character, period: Period): Character => ({ ...character, tasks: character.tasks.map(task => task.period === period ? { ...task, done: false } : task) })
export function loadSaved(getStorage: () => StoragePort = () => window.localStorage): { data: Checklist; warning: string; blocked: boolean; raw?: string | null } {
  let text: string | null
  try { text = getStorage().getItem(STORAGE_KEY) } catch { return { data: emptyChecklist(), warning: '保存データを読み込めません。この画面の変更は自動保存しません。JSONを書き出すか、内容を確認して保存を再試行してください。', blocked: true } }
  if (text === null) return { data: emptyChecklist(), warning: '', blocked: false, raw: null }
  try { return { data: decodeChecklist(text), warning: '', blocked: false, raw: text } } catch { return { data: emptyChecklist(), warning: '保存データの形式が不正です。自動では上書きしません。復元するか、この画面の内容で保存を再試行できます。', blocked: true, raw: text } }
}
export function saveSaved(data: Checklist, getStorage: () => StoragePort = () => window.localStorage, expected?: string | null): string {
  try { const storage = getStorage(), encoded = encodeChecklist(data), current = storage.getItem(STORAGE_KEY); if (expected !== undefined && current !== expected) return CONFLICT_WARNING; storage.setItem(STORAGE_KEY, encoded); return '' } catch { return '保存できませんでした。変更はこの画面に反映していますが、再読込すると失われます。JSONを書き出すか、保存を再試行してください。' }
}
