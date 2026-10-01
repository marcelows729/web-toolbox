import { useEffect, useRef, useState } from 'react'
import { prepareImages } from './imageBrowser'
import type { ImageOutput, LocalImage } from './imageBrowser'
let workQueue: Promise<unknown> = Promise.resolve()
function enqueue<T>(task: () => Promise<T>): Promise<T> { const next = workQueue.catch(() => undefined).then(task); workQueue = next.then(() => undefined, () => undefined); return next }
export function useImageWork() {
  const [images, setImages] = useState<LocalImage[]>([])
  const [output, setOutput] = useState<ImageOutput | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const revision = useRef(0)
  const mounted = useRef(true)
  // Effect-owned cleanup calls this helper so each pending operation checks the latest revision.
  useEffect(() => { mounted.current = true; const dispose = () => { mounted.current = false; revision.current++ }; return dispose }, [])
  const resetResult = () => { revision.current++; setOutput(null); setBusy(false); setError('') }
  const clear = () => { resetResult(); setImages([]) }
  const run = async (task: (isCurrent: () => boolean) => Promise<ImageOutput>) => {
    const token = ++revision.current
    const isCurrent = () => mounted.current && revision.current === token
    setOutput(null); setError(''); setBusy(true)
    try { const next = await enqueue(() => task(isCurrent)); if (isCurrent()) setOutput(next) }
    catch (cause) { if (isCurrent()) setError(cause instanceof Error ? cause.message : '画像処理に失敗しました。') }
    finally { if (isCurrent()) setBusy(false) }
  }
  const load = async (files: File[], min: number, max: number) => {
    const token = ++revision.current
    const isCurrent = () => mounted.current && revision.current === token
    setImages([]); setOutput(null); setError(''); setBusy(true)
    try { const next = await enqueue(() => prepareImages(files, min, max, isCurrent)); if (isCurrent()) setImages(next) }
    catch (cause) { if (isCurrent()) setError(cause instanceof Error ? cause.message : '画像を読み込めませんでした。') }
    finally { if (isCurrent()) setBusy(false) }
  }
  const reorder = (from: number, to: number) => { resetResult(); setImages(previous => { const next = [...previous]; const item = next.splice(from, 1)[0]; next.splice(to, 0, item); return next }) }
  return { images, output, busy, error, resetResult, clear, run, load, reorder }
}
