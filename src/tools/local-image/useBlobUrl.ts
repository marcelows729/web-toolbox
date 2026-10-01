import { useEffect, useState } from 'react'
export function useBlobUrl(blob: Blob | null): string | null {
  const [value, setValue] = useState<{ blob: Blob; url: string } | null>(null)
  useEffect(() => {
    // Object URLs are external browser resources, acquired and released with this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!blob) { setValue(null); return }
    const url = URL.createObjectURL(blob); setValue({ blob, url })
    return () => URL.revokeObjectURL(url)
  }, [blob])
  return value?.blob === blob ? value?.url ?? null : null
}
