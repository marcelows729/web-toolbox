import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ToolShelfContext } from './ToolShelfContext'
import { emptyShelf, loadShelf, parseShelf, saveShelf, SHELF_KEY, updateShelf } from './toolShelf'
import type { ShelfAction } from './toolShelf'

export default function ToolShelfProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try { return loadShelf(window.localStorage) }
    catch { return { shelf: emptyShelf(), unavailable: true } }
  })
  const [shelf, setShelf] = useState(initial.shelf)
  const [unavailable, setUnavailable] = useState(initial.unavailable)
  const current = useRef(shelf)
  const change = useCallback((action: ShelfAction) => {
    const next = updateShelf(current.current, action)
    if (next === current.current) return
    current.current = next
    setShelf(next)
    try { setUnavailable(!saveShelf(window.localStorage, next)) }
    catch { setUnavailable(true) }
  }, [])
  const visit = useCallback((id: string) => change({ type: 'visit', id }), [change])
  const toggleFavorite = useCallback((id: string) => change({ type: 'favorite', id }), [change])
  const clearRecent = useCallback(() => change({ type: 'clear-recent' }), [change])
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      try { if (event.storageArea !== window.localStorage) return } catch { return }
      if (event.key !== SHELF_KEY && event.key !== null) return
      const next = parseShelf(event.key === null ? null : event.newValue)
      current.current = next
      setShelf(next)
      setUnavailable(false)
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  return <ToolShelfContext.Provider value={{ shelf, unavailable, visit, toggleFavorite, clearRecent }}>{children}</ToolShelfContext.Provider>
}
