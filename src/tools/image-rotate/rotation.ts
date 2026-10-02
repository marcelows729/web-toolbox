import { checkDimensions } from '../local-image/imageMath'
import type { ImageSize, ImageTransform } from '../local-image/imageMath'
export type Orientation = { a: number; b: number; c: number; d: number }
export type RotationOperation = 'right' | 'left' | 'half' | 'horizontal' | 'vertical'
export const originalOrientation = (): Orientation => ({ a: 1, b: 0, c: 0, d: 1 })
const operations: Record<RotationOperation, Orientation> = {
  right: { a: 0, b: 1, c: -1, d: 0 }, left: { a: 0, b: -1, c: 1, d: 0 },
  half: { a: -1, b: 0, c: 0, d: -1 }, horizontal: { a: -1, b: 0, c: 0, d: 1 }, vertical: { a: 1, b: 0, c: 0, d: -1 },
}
function validate(value: Orientation): void {
  const { a, b, c, d } = value
  if (![a,b,c,d].every(n => Number.isInteger(n) && Math.abs(n) <= 1) || a*a+b*b !== 1 || c*c+d*d !== 1 || a*c+b*d !== 0) throw new Error('画像の向きを確認できません。元に戻してお試しください。')
}
export function changeOrientation(current: Orientation, operation: RotationOperation): Orientation {
  validate(current)
  const next = operations[operation]
  if (!next) throw new Error('対応していない画像操作です。')
  const clean = (n: number) => n === 0 ? 0 : n
  return { a: clean(next.a*current.a+next.c*current.b), b: clean(next.b*current.a+next.d*current.b), c: clean(next.a*current.c+next.c*current.d), d: clean(next.b*current.c+next.d*current.d) }
}
export function rotationPlan(source: ImageSize, orientation: Orientation): { size: ImageSize; transform: ImageTransform } {
  checkDimensions(source); validate(orientation)
  const { a,b,c,d } = orientation
  const xs = [0,a*source.width,c*source.height,a*source.width+c*source.height]
  const ys = [0,b*source.width,d*source.height,b*source.width+d*source.height]
  const size = { width: Math.max(...xs)-Math.min(...xs), height: Math.max(...ys)-Math.min(...ys) }
  checkDimensions(size)
  return { size, transform: { ...orientation, e: -Math.min(...xs) || 0, f: -Math.min(...ys) || 0 } }
}
