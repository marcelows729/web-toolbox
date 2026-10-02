import { categoryLabels } from '../types/tool'
import type { ToolCategory } from '../types/tool'
export type CatalogueState = { version: 1; query: string; category: 'all' | ToolCategory; collection: 'all' | 'favorites' | 'recent' }
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
export const defaultCatalogue = (): CatalogueState => ({ version: 1, query: '', category: 'all', collection: 'all' })
function parse(value: unknown): CatalogueState | undefined {
  if (!record(value) || value.version !== 1) return undefined
  return { version: 1, query: typeof value.query === 'string' ? value.query : '', category: typeof value.category === 'string' && (value.category === 'all' || Object.hasOwn(categoryLabels, value.category)) ? value.category as CatalogueState['category'] : 'all', collection: value.collection === 'favorites' || value.collection === 'recent' ? value.collection : 'all' }
}
export const readCatalogue = (state: unknown): CatalogueState => (record(state) ? parse(state.catalogue) : undefined) ?? defaultCatalogue()
export const catalogueReturnState = (catalogue: CatalogueState) => ({ catalogueReturn: catalogue, catalogueOriginIndex: typeof window !== 'undefined' ? window.history.state?.idx : undefined })
export function canReturnToCatalogue(state: unknown, index: unknown): boolean {
  return record(state) && catalogueHomeState(state) !== undefined && Number.isSafeInteger(state.catalogueOriginIndex) && (state.catalogueOriginIndex as number) >= 0 && Number.isSafeInteger(index) && index === (state.catalogueOriginIndex as number) + 1
}
export function catalogueHomeState(state: unknown): { catalogue: CatalogueState } | undefined {
  const catalogue = record(state) ? parse(state.catalogueReturn) : undefined
  return catalogue ? { catalogue } : undefined
}
