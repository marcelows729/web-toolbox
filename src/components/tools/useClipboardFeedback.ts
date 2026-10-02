import { useEffect, useRef, useState } from 'react'

// Structured and live results supply their own copy text, but still invalidate
// notifications when inputs, results, or the current page change.
export function useClipboardFeedback(timeoutMs = 0) {
  const [feedback, setFeedback] = useState('')
  const revision = useRef(0)
  useEffect(() => () => { revision.current += 1 }, [])
  useEffect(() => {
    if (!feedback || !timeoutMs) return
    const timer = window.setTimeout(() => setFeedback(''), timeoutMs)
    return () => window.clearTimeout(timer)
  }, [feedback, timeoutMs])
  const reset = () => { revision.current += 1; setFeedback('') }
  const copy = async (text: string, success = 'コピーしました') => {
    const current = ++revision.current
    setFeedback('')
    try {
      await navigator.clipboard.writeText(text)
      if (current === revision.current) setFeedback(success)
    } catch {
      if (current === revision.current) setFeedback('コピーに失敗しました')
    }
  }
  return { feedback, reset, copy }
}
