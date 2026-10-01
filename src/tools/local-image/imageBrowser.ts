import { inspectImage } from './imageHeader'
import { checkDimensions, IMAGE_LIMITS, outputFilename } from './imageMath'
import type { ImageMime, ImagePlacement, ImageSize } from './imageMath'
export type LocalImage = ImageSize & { file: File; mime: ImageMime; thumbnail: Blob }
export type ImageOutput = ImageSize & { blob: Blob; name: string; mime: ImageMime }
export function abortIfStale(isCurrent: () => boolean): void { if (!isCurrent()) throw new DOMException('中断しました。', 'AbortError') }
async function decode(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== 'function') throw new Error('このブラウザでは画像処理を利用できません。新しいブラウザでお試しください。')
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }) }
  catch { throw new Error('画像を読み込めませんでした。破損や未対応の符号化方式がないか確認してください。') }
}
export function encodeCanvas(canvas: HTMLCanvasElement, mime: ImageMime, quality: number): Promise<Blob> {
  if (!Number.isFinite(quality) || quality < 0.1 || quality > 1) return Promise.reject(new Error('品質は10〜100で指定してください。'))
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('書き出しに時間がかかっています。画像を小さくして再度お試しください。')), 20000)
    try { canvas.toBlob(blob => {
      clearTimeout(timeout)
      if (!blob || !blob.size) { reject(new Error('画像を書き出せませんでした。サイズを小さくして再度お試しください。')); return }
      if (blob.type !== mime) { reject(new Error('指定した出力形式に、このブラウザは対応していません。PNGなど別の形式を選んでください。')); return }
      if (blob.size > IMAGE_LIMITS.outputBytes) { reject(new Error('出力が16 MiBを超えました。サイズや品質を下げてください。')); return }
      resolve(blob)
    }, mime, quality) } catch { clearTimeout(timeout); reject(new Error('画像の書き出しに失敗しました。サイズや形式を変えてお試しください。')) }
  })
}
export async function prepareImages(files: File[], min: number, max: number, isCurrent: () => boolean): Promise<LocalImage[]> {
  if (files.length < min || files.length > max) throw new Error(`${min === max ? min : `${min}〜${max}`}枚の画像を選んでください。`)
  if (files.some(file => file.size < 12 || file.size > IMAGE_LIMITS.fileBytes) || files.reduce((sum, file) => sum + file.size, 0) > IMAGE_LIMITS.totalBytes) throw new Error('1枚8 MiB、入力合計24 MiB以内の画像を選んでください。')
  const headers = []
  let pixels = 0
  for (const file of files) {
    abortIfStale(isCurrent)
    const header = inspectImage(new Uint8Array(await file.arrayBuffer()), file.type)
    pixels += header.width * header.height
    if (pixels > IMAGE_LIMITS.totalPixels) throw new Error('入力画像の合計は2000万画素以内にしてください。')
    headers.push(header)
  }
  const prepared: LocalImage[] = []
  for (const [index, file] of files.entries()) {
    abortIfStale(isCurrent)
    const bitmap = await decode(file)
    let canvas: HTMLCanvasElement | null = null
    try {
      abortIfStale(isCurrent); checkDimensions(bitmap)
      const header = headers[index]
      if (bitmap.width * bitmap.height !== header.width * header.height) throw new Error('画像の寸法情報が一致しません。元の画像を確認してください。')
      const scale = Math.min(240 / bitmap.width, 180 / bitmap.height, 1)
      canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('画像を描画できません。このブラウザでは利用できない可能性があります。')
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const thumbnail = await encodeCanvas(canvas, 'image/png', 1)
      abortIfStale(isCurrent)
      prepared.push({ file, mime: header.mime, width: bitmap.width, height: bitmap.height, thumbnail })
    } finally { bitmap.close(); if (canvas) { canvas.width = 0; canvas.height = 0 } }
  }
  return prepared
}
export async function renderImages(images: LocalImage[], placements: ImagePlacement[], size: ImageSize, mime: ImageMime, quality: number, background: 'transparent' | 'white' | 'black', isCurrent: () => boolean): Promise<ImageOutput> {
  checkDimensions(size, IMAGE_LIMITS.outputPixels)
  abortIfStale(isCurrent)
  const canvas = document.createElement('canvas'); canvas.width = size.width; canvas.height = size.height
  try {
    const context = canvas.getContext('2d')
    if (!context) throw new Error('画像を描画できません。このブラウザでは利用できない可能性があります。')
    if (mime === 'image/jpeg' || background !== 'transparent') { context.fillStyle = background === 'black' ? '#000000' : '#ffffff'; context.fillRect(0, 0, size.width, size.height) }
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high'
    for (const [index, image] of images.entries()) {
      abortIfStale(isCurrent)
      const bitmap = await decode(image.file)
      try { abortIfStale(isCurrent); checkDimensions(bitmap); if (bitmap.width !== image.width || bitmap.height !== image.height) throw new Error('画像の読み込み寸法が変わりました。画像を選び直してください。'); const place = placements[index]; context.drawImage(bitmap, place.x, place.y, place.width, place.height) }
      finally { bitmap.close() }
    }
    const blob = await encodeCanvas(canvas, mime, quality)
    abortIfStale(isCurrent)
    return { ...size, blob, mime, name: images.length === 1 ? outputFilename(images[0].file.name, 'resized', mime) : `poketsuru-joined.${mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png'}` }
  } finally { canvas.width = 0; canvas.height = 0 }
}
