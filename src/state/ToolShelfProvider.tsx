import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ToolShelfContext } from './ToolShelfContext'
import { emptyShelf, loadShelf, saveShelf, SHELF_KEY, updateShelf } from './toolShelf'
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
      // Storage events can arrive after a newer save in this tab. Read the
      // current stored snapshot rather than replaying the event's old value.
      const latest = loadShelf(window.localStorage)
      if (latest.unavailable) {
        setUnavailable(true)
        return
      }
      current.current = latest.shelf
      setShelf(latest.shelf)
      // A successful read does not establish that this tab can write. The
      // next successful local save clears a previous failure notice.
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  return <ToolShelfContext.Provider value={{ shelf, unavailable, visit, toggleFavorite, clearRecent }}>{children}</ToolShelfContext.Provider>
}
