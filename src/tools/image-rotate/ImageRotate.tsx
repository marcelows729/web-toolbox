import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ImageToolShell from '../local-image/ImageToolShell'
import ImagePreview from '../local-image/ImagePreview'
import { useImageWork } from '../local-image/useImageWork'
import { renderImages } from '../local-image/imageBrowser'
import { imageBytes } from '../local-image/imageMath'
import { changeOrientation, originalOrientation, rotationPlan } from './rotation'
import type { RotationOperation } from './rotation'
const actions: [RotationOperation, string][] = [['left','左に90度'],['right','右に90度'],['half','180度回転'],['horizontal','左右反転'],['vertical','上下反転']]
export default function ImageRotate() {
  const work = useImageWork()
  const { run } = work
  const fileInput = useRef<HTMLInputElement>(null)
  const [orientation, setOrientation] = useState(originalOrientation)
  const image = work.images[0]
  const plan = image ? rotationPlan(image, orientation) : null
  useEffect(() => {
    if (!image) return
    void run(isCurrent => {
      const next = rotationPlan(image, orientation)
      return renderImages([image], [{ ...image, x: 0, y: 0 }], next.size, 'image/png', 1, 'transparent', isCurrent, { transform: next.transform, suffix: 'rotated' })
    })
  }, [image, orientation, run])
  const change = (operation: RotationOperation) => { work.resetResult(); setOrientation(current => changeOrientation(current, operation)) }
  return <ImageToolShell title="画像の回転・反転" description="写真を90度ずつ回転、または左右・上下に反転してPNGで保存します。" busy={work.busy} loading={work.loading} error={work.error} output={work.output} originalBytes={image?.file.size ?? 0} transform>
    <label className="field-label image-file-label" htmlFor="image-files">画像を1枚選ぶ<span>JPG / PNG / 静止WebP · 1枚8 MiBまで</span></label>
    <input ref={fileInput} id="image-files" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby={work.error ? 'image-error' : 'rotate-help'} onClick={e => { e.currentTarget.value = '' }} onChange={e => { const files = Array.from(e.target.files ?? []); if (files.length) { setOrientation(originalOrientation()); void work.load(files, 1, 1) } }} />
    {image && <div className="image-source"><ImagePreview blob={image.thumbnail} alt="選択した元画像の縮小プレビュー" /><div><strong>{image.file.name}</strong><p>元画像：{image.width} × {image.height} px · {imageBytes(image.file.size)}</p><p id="rotate-dimensions">現在の向き：{plan?.size.width} × {plan?.size.height} px</p></div></div>}
    <p className="image-hint" id="rotate-help">ボタンを押すたびに、今見ている向きから変更します。「元に戻す」で選択時の向きに戻せます。下の「できあがり」が保存される画像です。処理中に別の操作を押した場合は、最後の向きに更新します。</p>
    <div className="action-row image-rotate-actions" role="group" aria-label="画像の向きを変更">{actions.map(([operation,label]) => <button key={operation} id={'rotate-'+operation} type="button" className="secondary-button" disabled={!image || work.loading} onClick={() => change(operation)}>{label}</button>)}
      <button id="rotate-original" type="button" className="secondary-button" disabled={!image || work.loading} onClick={() => { work.resetResult(); setOrientation(originalOrientation()) }}>元に戻す</button>
    </div>
    <div className="action-row"><button id="image-clear" type="button" className="secondary-button" onClick={() => { work.clear(); setOrientation(originalOrientation()); if (fileInput.current) fileInput.current.value = '' }}>画像を消去・中断</button></div>
    <p className="image-hint">ほかの画像操作：<Link to="/tools/image-resizer">画像サイズ変更・圧縮</Link> · <Link to="/tools/image-joiner">画像を並べる</Link></p>
  </ImageToolShell>
}
