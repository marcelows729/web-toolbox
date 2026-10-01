import { createContext, useContext } from 'react'
import type { ToolShelf } from './toolShelf'

type ShelfContext = {
  shelf: ToolShelf
  unavailable: boolean
  toggleFavorite: (id: string) => void
  visit: (id: string) => void
  clearRecent: () => void
}
export const ToolShelfContext = createContext<ShelfContext | null>(null)
export function useToolShelf() {
  const value = useContext(ToolShelfContext)
  if (!value) throw new Error('ToolShelfProvider is required')
  return value
}
