import { useEffect, useRef, useState } from 'react'

// 入力変更、Clear、画面離脱後に古い計算・コピーの通知を反映しない。
export function useToolResult() {
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const revision = useRef(0)

  useEffect(() => () => { revision.current += 1 }, [])

  const reset = () => {
    revision.current += 1
    setOutput(null)
    setError('')
    setFeedback('')
    setBusy(false)
  }

  const run = async (calculate: () => string | Promise<string>) => {
    const current = ++revision.current
    setOutput(null)
    setError('')
    setFeedback('')
    setBusy(true)
    try {
      const value = await calculate()
      if (current === revision.current) setOutput(value)
    } catch (cause) {
      if (current === revision.current) {
        setError(cause instanceof Error ? cause.message : '処理に失敗しました。')
      }
    } finally {
      if (current === revision.current) setBusy(false)
    }
  }

  const copy = async () => {
    if (output === null) return
    const current = revision.current
    setFeedback('')
    setError('')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(output)
      if (current === revision.current) setFeedback('コピーしました')
    } catch {
      if (current === revision.current) {
        setError('コピーできませんでした。出力欄を選択して手動でコピーしてください。')
      }
    }
  }

  return { output, error, feedback, busy, reset, run, copy }
}
