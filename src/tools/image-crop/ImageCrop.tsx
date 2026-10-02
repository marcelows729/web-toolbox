import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import ImageToolShell from '../local-image/ImageToolShell'
import ImagePreview from '../local-image/ImagePreview'
import { useImageWork } from '../local-image/useImageWork'
import { renderImages } from '../local-image/imageBrowser'
import { imageBytes } from '../local-image/imageMath'
import { centeredCrop, cropDraft, cropRatios, cropRectangle, dragCrop, keyboardCrop } from './crop'
import type { CropDraft, CropRatio } from './crop'
import './ImageCrop.css'
const emptyDraft: CropDraft = { x: '0', y: '0', width: '', height: '' }
export default function ImageCrop() {
  const work = useImageWork()
  const image = work.images[0]
  const fileInput = useRef<HTMLInputElement>(null)
  const anchor = useRef<{ x: number; y: number } | null>(null)
  const [ratio, setRatio] = useState<CropRatio>('free')
  const [draft, setDraft] = useState<CropDraft>(emptyDraft)
  const [presetError, setPresetError] = useState('')
  const [configuredImage, setConfiguredImage] = useState(image)
  // A newly decoded file starts with its own full-image selection.
  if (configuredImage !== image) {
    setConfiguredImage(image); setRatio('free'); setDraft(image ? cropDraft(centeredCrop(image, 'free')) : emptyDraft); setPresetError('')
  }
  let rect = null, validation = ''
  if (image) { try { rect = cropRectangle(image, draft, ratio) } catch (cause) { validation = cause instanceof Error ? cause.message : '範囲を確認してください。' } }
  const change = (next: CropDraft) => { work.resetResult(); setPresetError(''); setDraft(next) }
  const chooseRatio = (next: CropRatio) => {
    if (!image) return
    try { const selected = centeredCrop(image, next); change(cropDraft(selected)); setRatio(next) }
    catch (cause) { setPresetError(cause instanceof Error ? cause.message : '比率を選び直してください。') }
  }
  const point = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return { x: Math.max(0, Math.min(image!.width, Math.round((event.clientX - bounds.left) / bounds.width * image!.width))), y: Math.max(0, Math.min(image!.height, Math.round((event.clientY - bounds.top) / bounds.height * image!.height))) }
  }
  const updateDrag = (event: PointerEvent<HTMLDivElement>) => { if (!image || !anchor.current) return; const next = dragCrop(image, anchor.current, point(event), ratio); if (next) change(cropDraft(next)) }
  const pair = cropRatios[ratio]
  return <ImageToolShell title="画像の切り抜き" description="写真の必要な範囲を選び、元の画素サイズのままPNGで保存します。" busy={work.busy} loading={work.loading} error={work.error} output={work.output} originalBytes={image?.file.size ?? 0} crop>
    <label className="field-label image-file-label" htmlFor="image-files">画像を1枚選ぶ<span>JPG / PNG / 静止WebP · 1枚8 MiBまで</span></label>
    <input ref={fileInput} id="image-files" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby={work.error ? 'image-error' : 'crop-help'} onClick={e => { e.currentTarget.value = '' }} onChange={e => { const files = Array.from(e.target.files ?? []); if (files.length) { anchor.current = null; void work.load(files, 1, 1) } }} />
    {image && <p className="crop-source-name"><strong>{image.file.name}</strong><br />元画像：{image.width} × {image.height} px · {imageBytes(image.file.size)}</p>}
    <fieldset className="crop-controls" disabled={!image || work.loading}>
      <legend>切り抜く範囲</legend>
      <label className="field-label" htmlFor="crop-ratio">縦横比<select id="crop-ratio" value={ratio} onChange={e => chooseRatio(e.target.value as CropRatio)}><option value="free">自由指定</option><option value="1:1">1:1（正方形）</option><option value="4:3">4:3</option><option value="16:9">16:9</option></select></label>
      <div className="everyday-columns crop-numbers">{(['x','y','width','height'] as const).map(key => <label className="field-label" key={key} htmlFor={'crop-'+key}>{({ x: '左から（px）', y: '上から（px）', width: '幅（px）', height: '高さ（px）' })[key]}<input id={'crop-'+key} type="number" min={key === 'x' || key === 'y' ? 0 : pair && key === 'width' ? pair[0] : 1} max={image ? key === 'x' || key === 'width' ? image.width : image.height : undefined} step={pair && key === 'width' ? pair[0] : 1} value={draft[key]} readOnly={!!pair && key === 'height'} aria-describedby="crop-help crop-range" aria-invalid={!!validation} onChange={e => { const next = { ...draft, [key]: e.target.value }; if (pair && key === 'width') { const width = Number(e.target.value); next.height = e.target.value && Number.isInteger(width) && width > 0 && width % pair[0] === 0 ? String(width / pair[0] * pair[1]) : '' } change(next) }} /></label>)}</div>
      <p className="image-hint" id="crop-help">位置は画像の左上を0として指定します。{pair ? `幅は${pair[0]} px単位。高さは比率から自動で決まります。` : '幅と高さは1 pxから指定できます。'}画像の外にはみ出した範囲は保存できません。</p>
      <div className="action-row"><button className="secondary-button" id="crop-center" type="button" disabled={!rect} onClick={() => { if (image && rect) change(cropDraft({ ...rect, x: Math.floor((image.width - rect.width) / 2), y: Math.floor((image.height - rect.height) / 2) })) }}>中央に置く</button><button className="secondary-button" id="crop-full" type="button" onClick={() => chooseRatio('free')}>画像全体に戻す</button></div>
    </fieldset>
    {(validation || presetError) && <p id="crop-validation" className="error-box" role="alert">{presetError || validation}</p>}
    {image && <>
      <p className="image-hint" id="crop-keyboard">プレビューをドラッグして範囲を選べます。プレビューにTabで移動し、矢印キーで位置、Alt＋矢印キーでサイズを変更。Shiftを加えると10単位ずつ変更します。数値欄だけでも操作できます。</p>
      <div className="crop-stage" id="crop-stage" role="group" aria-label="切り抜く範囲のプレビュー" aria-describedby="crop-keyboard crop-range" tabIndex={0} style={{ aspectRatio: `${image.width} / ${image.height}`, maxWidth: Math.min(640, 400 * image.width / image.height) }} onKeyDown={e => { if (!rect || !/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return; e.preventDefault(); change(cropDraft(keyboardCrop(image, rect, ratio, e.key, e.altKey, e.shiftKey))) }} onPointerDown={e => { if (e.button !== 0) return; anchor.current = point(e); e.currentTarget.setPointerCapture(e.pointerId); e.currentTarget.focus({ preventScroll: true }) }} onPointerMove={updateDrag} onPointerUp={e => { updateDrag(e); anchor.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId) }} onPointerCancel={() => { anchor.current = null }}>
        <ImagePreview blob={image.thumbnail} alt="元画像の縮小プレビュー。枠の内側を切り抜きます。" />
        {rect && <div className="crop-selection" style={{ left: `${rect.x / image.width * 100}%`, top: `${rect.y / image.height * 100}%`, width: `${rect.width / image.width * 100}%`, height: `${rect.height / image.height * 100}%` }} />}
      </div>
    </>}
    <p className="image-hint" id="crop-range">{rect ? `切り抜く範囲：左 ${rect.x}・上 ${rect.y} / ${rect.width} × ${rect.height} px` : '画像を選び、有効な範囲を指定してください。'}</p>
    <div className="action-row"><button id="image-process" type="button" className="primary-button" disabled={!image || !rect || work.busy} onClick={() => { if (!image || !rect) return; const selected = rect; void work.run(isCurrent => renderImages([image], [{ ...image, x: 0, y: 0 }], selected, 'image/png', 1, 'transparent', isCurrent, { transform: { a: 1, b: 0, c: 0, d: 1, e: -selected.x, f: -selected.y }, suffix: 'cropped' })) }}>この範囲を切り抜く</button><button id="image-clear" type="button" className="secondary-button" onClick={() => { anchor.current = null; work.clear(); if (fileInput.current) fileInput.current.value = '' }}>画像を消去・中断</button></div>
    <p className="image-hint">範囲や比率を変更すると、前の結果は消えます。新しい範囲で切り抜いてから保存してください。背景を自動で消す機能ではありません。</p>
    <p className="image-hint">ほかの画像操作：<Link to="/tools/image-resizer">画像サイズ変更・圧縮</Link> · <Link to="/tools/image-rotate">画像の回転・反転</Link></p>
  </ImageToolShell>
}
