import { checkDimensions, pixelInteger } from '../local-image/imageMath'
import type { ImagePlacement, ImageSize } from '../local-image/imageMath'
export type CropRatio = 'free' | '1:1' | '4:3' | '16:9'
export type CropDraft = { x: string; y: string; width: string; height: string }
export const cropRatios: Record<CropRatio, readonly [number, number] | null> = { free: null, '1:1': [1, 1], '4:3': [4, 3], '16:9': [16, 9] }
export function cropDraft(rect: ImagePlacement): CropDraft { return { x: String(rect.x), y: String(rect.y), width: String(rect.width), height: String(rect.height) } }
export function cropRectangle(source: ImageSize, draft: CropDraft, ratio: CropRatio): ImagePlacement {
  checkDimensions(source)
  const pair = cropRatios[ratio]
  if (pair === undefined) throw new Error('切り抜きの比率を選び直してください。')
  const x = pixelInteger(draft.x, 0, source.width - 1), y = pixelInteger(draft.y, 0, source.height - 1)
  const width = pixelInteger(draft.width, 1, source.width)
  if (pair && width % pair[0] !== 0) throw new Error(`${ratio}では幅を${pair[0]}の倍数にしてください。高さは自動で決まります。`)
  const height = pixelInteger(draft.height, 1, source.height)
  if (x + width > source.width || y + height > source.height) throw new Error('範囲が画像の外にはみ出しています。位置またはサイズを小さくしてください。')
  if (pair && width * pair[1] !== height * pair[0]) throw new Error(`${ratio}では幅を${pair[0]}の倍数にしてください。高さは自動で決まります。`)
  return { x, y, width, height }
}
export function centeredCrop(source: ImageSize, ratio: CropRatio): ImagePlacement {
  checkDimensions(source)
  const pair = cropRatios[ratio]
  if (pair === undefined) throw new Error('切り抜きの比率を選び直してください。')
  const units = pair ? Math.floor(Math.min(source.width / pair[0], source.height / pair[1])) : 1
  if (!units) throw new Error('この画像は選択した比率の最小サイズより小さいため、自由指定を使ってください。')
  const width = pair ? units * pair[0] : source.width, height = pair ? units * pair[1] : source.height
  return { x: Math.floor((source.width - width) / 2), y: Math.floor((source.height - height) / 2), width, height }
}
export function dragCrop(source: ImageSize, start: { x: number; y: number }, end: { x: number; y: number }, ratio: CropRatio): ImagePlacement | null {
  const pair = cropRatios[ratio]
  let width = Math.abs(end.x - start.x), height = Math.abs(end.y - start.y)
  if (pair) { const units = Math.floor(Math.min(width / pair[0], height / pair[1])); width = units * pair[0]; height = units * pair[1] }
  if (!width || !height) return null
  const x = end.x >= start.x ? start.x : start.x - width
  const y = end.y >= start.y ? start.y : start.y - height
  return cropRectangle(source, cropDraft({ x, y, width, height }), ratio)
}
export function keyboardCrop(source: ImageSize, rect: ImagePlacement, ratio: CropRatio, key: string, resize: boolean, large: boolean): ImagePlacement {
  const amount = large ? 10 : 1
  const pair = cropRatios[ratio]
  let { x, y, width, height } = rect
  if (resize) {
    const direction = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1
    if (pair) {
      const units = Math.max(1, Math.min(width / pair[0] + direction * amount, Math.floor((source.width - x) / pair[0]), Math.floor((source.height - y) / pair[1])))
      width = units * pair[0]; height = units * pair[1]
    } else if (key === 'ArrowRight' || key === 'ArrowLeft') width = Math.max(1, Math.min(source.width - x, width + direction * amount))
    else height = Math.max(1, Math.min(source.height - y, height + direction * amount))
  } else {
    if (key === 'ArrowRight') x = Math.min(source.width - width, x + amount)
    if (key === 'ArrowLeft') x = Math.max(0, x - amount)
    if (key === 'ArrowDown') y = Math.min(source.height - height, y + amount)
    if (key === 'ArrowUp') y = Math.max(0, y - amount)
  }
  return cropRectangle(source, cropDraft({ x, y, width, height }), ratio)
}
