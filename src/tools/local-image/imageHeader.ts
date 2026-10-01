import { checkDimensions, IMAGE_LIMITS } from './imageMath'
import type { ImageMime, ImageSize } from './imageMath'
export type ImageHeader = ImageSize & { mime: ImageMime }
const bad = () => new Error('画像の形式や内容を確認できません。破損していないJPG・PNG・静止WebPを選んでください。')
const animated = () => new Error('アニメーション画像（APNG・animated WebP）は対応していません。静止画像を選んでください。')
const crcTable = new Uint32Array(256).map((_, value) => { let crc = value; for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1; return crc >>> 0 })
export function inspectImage(bytes: Uint8Array, declaredType = ''): ImageHeader {
  if (bytes.length < 12) throw bad()
  if (bytes.length > IMAGE_LIMITS.fileBytes) throw new Error('画像1枚は8 MiB以内にしてください。')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const text = (start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length))
  let width = 0; let height = 0; let mime: ImageMime
  if ([137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value)) {
    mime = 'image/png'
    let cursor = 8; let data = false; let ended = false
    while (cursor < bytes.length) {
      if (cursor + 12 > bytes.length) throw bad()
      const length = view.getUint32(cursor); const name = text(cursor + 4, 4)
      const end = cursor + length + 12
      if (end > bytes.length) throw bad()
      if (['acTL','fcTL','fdAT'].includes(name)) throw animated()
      let crc = 0xffffffff
      for (let index = cursor + 4; index < end - 4; index++) crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[index]) & 255]
      if ((crc ^ 0xffffffff) >>> 0 !== view.getUint32(end - 4)) throw bad()
      if (cursor === 8 && (name !== 'IHDR' || length !== 13)) throw bad()
      if (name === 'IHDR') { if (cursor !== 8) throw bad(); width = view.getUint32(cursor + 8); height = view.getUint32(cursor + 12) }
      else if (name === 'IDAT') data = true
      else if (name === 'IEND') { if (length || end !== bytes.length || !data) throw bad(); ended = true }
      else if (/^[A-Z]/.test(name) && name !== 'PLTE') throw bad()
      cursor = end
    }
    if (!ended) throw bad()
  } else if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    mime = 'image/jpeg'
    let cursor = 2; let scan = false
    while (cursor < bytes.length) {
      if (bytes[cursor++] !== 0xff) throw bad()
      while (bytes[cursor] === 0xff) cursor++
      const marker = bytes[cursor++]
      if (marker === 0xd9) break
      if (marker === 0xd8 || marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue
      if (cursor + 2 > bytes.length) throw bad()
      const length = view.getUint16(cursor)
      if (length < 2 || cursor + length > bytes.length) throw bad()
      if ([0xc0,0xc1,0xc2].includes(marker)) { if (length < 8 || width) throw bad(); height = view.getUint16(cursor + 3); width = view.getUint16(cursor + 5) }
      else if (marker >= 0xc3 && marker <= 0xcf && ![0xc4,0xc8,0xcc].includes(marker)) throw new Error('このJPEGの符号化方式は対応していません。一般的なJPEGを選んでください。')
      if (marker === 0xda) { scan = true; break }
      cursor += length
    }
    // Strictly reject truncated files and appended multi-picture data.
    if (!scan || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) throw bad()
    // MPF marks multi-picture JPEG; converting just its first picture is out of scope.
    for (let i = 2; i + 8 < cursor; i++) if (bytes[i] === 0xff && bytes[i + 1] === 0xe2 && text(i + 4, 4) === 'MPF\0') throw new Error('複数画像を含むJPEGは対応していません。通常の静止JPEGを選んでください。')
  } else if (text(0,4) === 'RIFF' && text(8,4) === 'WEBP') {
    mime = 'image/webp'
    if (view.getUint32(4,true) + 8 !== bytes.length) throw bad()
    let cursor = 12; let frames = 0; let frameWidth = 0; let frameHeight = 0
    const u24 = (offset: number) => bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16)
    while (cursor < bytes.length) {
      if (cursor + 8 > bytes.length) throw bad()
      const name = text(cursor,4); const length = view.getUint32(cursor + 4,true); const data = cursor + 8
      const end = data + length + (length % 2)
      if (end > bytes.length) throw bad()
      if (name === 'ANIM' || name === 'ANMF') throw animated()
      if (name === 'VP8X') { if (cursor !== 12 || length !== 10 || width) throw bad(); if (bytes[data] & 2) throw animated(); width = u24(data + 4) + 1; height = u24(data + 7) + 1 }
      if (name === 'VP8 ') { if (length < 10 || text(data + 3,3) !== '\x9d\x01\x2a') throw bad(); frameWidth = view.getUint16(data + 6,true) & 0x3fff; frameHeight = view.getUint16(data + 8,true) & 0x3fff; frames++ }
      if (name === 'VP8L') { if (length < 5 || bytes[data] !== 0x2f) throw bad(); const bits = view.getUint32(data + 1,true); frameWidth = (bits & 0x3fff) + 1; frameHeight = ((bits >>> 14) & 0x3fff) + 1; frames++ }
      cursor = end
    }
    if (frames !== 1 || width && (width !== frameWidth || height !== frameHeight)) throw bad()
    width ||= frameWidth; height ||= frameHeight
  } else throw new Error('JPG・PNG・静止WebPだけに対応しています。GIF・HEIC・SVGなどは使えません。')
  if (declaredType && declaredType !== mime && declaredType !== 'application/octet-stream') throw new Error('ファイルの形式表示と内容が一致しません。元の画像を確認してください。')
  const header = { mime, width, height }
  checkDimensions(header)
  return header
}
