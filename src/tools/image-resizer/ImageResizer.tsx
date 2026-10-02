import { useRef, useState } from 'react'
import ImageToolShell from '../local-image/ImageToolShell'
import ImagePreview from '../local-image/ImagePreview'
import { useImageWork } from '../local-image/useImageWork'
import { renderImages } from '../local-image/imageBrowser'
import { imageBytes, pixelInteger, resizeDimensions } from '../local-image/imageMath'
import type { ImageMime } from '../local-image/imageMath'
export default function ImageResizer() {
  const work = useImageWork()
  const input = useRef<HTMLInputElement>(null)
  const [width, setWidth] = useState('1200'); const [height, setHeight] = useState('1200')
  const [mime, setMime] = useState<ImageMime>('image/jpeg'); const [quality, setQuality] = useState('85')
  const [enlarge, setEnlarge] = useState(false)
  const image = work.images[0]
  return <ImageToolShell title="画像サイズ変更・圧縮" description="写真を、送りやすいサイズに。画像はブラウザの外へ出しません。" busy={work.busy} loading={work.loading} error={work.error} output={work.output} originalBytes={image?.file.size ?? 0}>
    <label className="field-label image-file-label" htmlFor="image-files">画像を1枚選ぶ<span>JPG / PNG / 静止WebP · 1枚8 MiBまで</span></label><input aria-describedby={work.error ? 'image-error' : undefined} ref={input} id="image-files" type="file" accept="image/jpeg,image/png,image/webp" onClick={e => { e.currentTarget.value = '' }} onChange={e => { const files = Array.from(e.target.files ?? []); if (files.length) void work.load(files, 1, 1) }} />
    {image && <div className="image-source"><ImagePreview blob={image.thumbnail} alt="選択した画像の縮小プレビュー" /><div><strong>{image.file.name}</strong><p>変更前：{image.width} × {image.height} px · {imageBytes(image.file.size)}</p></div></div>}
    <div className="image-settings everyday-columns"><label className="field-label" htmlFor="image-width">最大幅（px）<input aria-describedby={work.error ? 'image-error' : undefined} id="image-width" disabled={work.loading} type="text" inputMode="numeric" value={width} onChange={e => { setWidth(e.target.value); work.resetResult() }} /></label><label className="field-label" htmlFor="image-height">最大高さ（px）<input aria-describedby={work.error ? 'image-error' : undefined} id="image-height" disabled={work.loading} type="text" inputMode="numeric" value={height} onChange={e => { setHeight(e.target.value); work.resetResult() }} /></label><label className="field-label" htmlFor="image-format">出力形式<select aria-describedby={work.error ? 'image-error' : undefined} id="image-format" disabled={work.loading} value={mime} onChange={e => { setMime(e.target.value as ImageMime); work.resetResult() }}><option value="image/jpeg">JPEG</option><option value="image/png">PNG（透過対応）</option><option value="image/webp">WebP（透過対応）</option></select></label><label className="field-label" htmlFor="image-quality">品質（10〜100）<input aria-describedby={work.error ? 'image-error' : undefined} id="image-quality" type="text" inputMode="numeric" disabled={work.loading || mime === 'image/png'} value={quality} onChange={e => { setQuality(e.target.value); work.resetResult() }} /></label></div>
    <label className="image-checkbox"><input aria-describedby={work.error ? 'image-error' : undefined} id="image-enlarge" disabled={work.loading} type="checkbox" checked={enlarge} onChange={e => { setEnlarge(e.target.checked); work.resetResult() }} />小さな画像の拡大を許可する</label><p className="image-hint">縦横比は固定。既定では拡大しません。PNGの品質設定は使いません。{mime === 'image/jpeg' && 'JPEGでは透過部分を白背景にします。'}容量が増える場合もあります。</p>
    <div className="action-row"><button id="image-process" type="button" className="primary-button" disabled={!image || work.busy} onClick={() => void work.run(isCurrent => { const size = resizeDimensions(image, pixelInteger(width, 1, 8192), pixelInteger(height, 1, 8192), enlarge); return renderImages([image], [{ ...size, x: 0, y: 0 }], size, mime, mime === 'image/png' ? 1 : pixelInteger(quality, 10, 100) / 100, 'transparent', isCurrent) })}>サイズを変更・書き出す</button><button id="image-clear" type="button" className="secondary-button" onClick={() => { work.clear(); if (input.current) input.current.value = '' }}>画像を消去・中断</button></div>
  </ImageToolShell>
}
