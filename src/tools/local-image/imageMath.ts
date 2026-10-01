export const IMAGE_LIMITS = { fileBytes: 8 * 1024 * 1024, totalBytes: 24 * 1024 * 1024, imagePixels: 12000000, totalPixels: 20000000, outputPixels: 12000000, side: 8192, outputBytes: 16 * 1024 * 1024 }
export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp'
export type ImageSize = { width: number; height: number }
export const imageExtensions: Record<ImageMime, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
export function checkDimensions(size: ImageSize, maxPixels = IMAGE_LIMITS.imagePixels): void {
  if (!Number.isSafeInteger(size.width) || !Number.isSafeInteger(size.height) || size.width < 1 || size.height < 1 || size.width > IMAGE_LIMITS.side || size.height > IMAGE_LIMITS.side || size.width * size.height > maxPixels) throw new Error('画像は各辺8192 px以内、1200万画素以内にしてください。')
}
export function pixelInteger(text: string, min: number, max: number): number {
  const value = text.trim().replace(/[０-９]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
  if (!/^\d{1,5}$/.test(value) || Number(value) < min || Number(value) > max) throw new Error(`${min}〜${max}の整数で入力してください。`)
  return Number(value)
}
export function resizeDimensions(source: ImageSize, maxWidth: number, maxHeight: number, enlarge = false): ImageSize {
  checkDimensions(source)
  if (![maxWidth, maxHeight].every(value => Number.isInteger(value) && value >= 1 && value <= IMAGE_LIMITS.side)) throw new Error('最大幅・高さは1〜8192 pxで指定してください。')
  const scale = Math.min(maxWidth / source.width, maxHeight / source.height, enlarge ? Infinity : 1)
  const size = { width: Math.max(1, Math.round(source.width * scale)), height: Math.max(1, Math.round(source.height * scale)) }
  checkDimensions(size, IMAGE_LIMITS.outputPixels)
  return size
}
export type ImagePlacement = ImageSize & { x: number; y: number }
export function joinDimensions(sizes: ImageSize[], direction: 'horizontal' | 'vertical', crossMax: number, gap: number): { size: ImageSize; placements: ImagePlacement[] } {
  if (sizes.length < 2 || sizes.length > 6 || !['horizontal', 'vertical'].includes(direction)) throw new Error('2〜6枚を選んでください。')
  if (!Number.isInteger(crossMax) || crossMax < 1 || crossMax > 4096 || !Number.isInteger(gap) || gap < 0 || gap > 200) throw new Error('そろえる辺は1〜4096 px、余白は0〜200 pxです。')
  sizes.forEach(size => checkDimensions(size))
  if (sizes.reduce((sum, size) => sum + size.width * size.height, 0) > IMAGE_LIMITS.totalPixels) throw new Error('入力画像の合計は2000万画素以内にしてください。')
  const cross = Math.min(crossMax, ...sizes.map(size => direction === 'horizontal' ? size.height : size.width))
  let cursor = 0
  const placements = sizes.map(source => {
    const scale = cross / (direction === 'horizontal' ? source.height : source.width)
    const width = direction === 'vertical' ? cross : Math.max(1, Math.round(source.width * scale))
    const height = direction === 'horizontal' ? cross : Math.max(1, Math.round(source.height * scale))
    const item = { width, height, x: direction === 'horizontal' ? cursor : 0, y: direction === 'vertical' ? cursor : 0 }
    cursor += (direction === 'horizontal' ? width : height) + gap
    return item
  })
  const size = direction === 'horizontal' ? { width: cursor - gap, height: cross } : { width: cross, height: cursor - gap }
  checkDimensions(size, IMAGE_LIMITS.outputPixels)
  return { size, placements }
}
export function outputFilename(original: string, suffix: string, mime: ImageMime): string {
  const clean = [...original].map(char => char.charCodeAt(0) < 32 ? '_' : char).join('')
  const base = clean.replace(/\.[^.]*$/, '').replace(/[<>:"/\\|?*]/g, '_').trim().replace(/[. ]+$/, '')
  return `${[...(base || 'image')].slice(0, 70).join('')}-${suffix}.${imageExtensions[mime]}`
}
export const imageBytes = (bytes: number) => `${(bytes / 1024).toLocaleString('ja-JP', { maximumFractionDigits: 1 })} KB`
