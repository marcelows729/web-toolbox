export type DiffOpType = 'equal' | 'add' | 'remove'

export type DiffOp = {
  type: DiffOpType
  text: string
}

/**
 * 改行コード(CRLF/CR)をLFへ正規化したうえで行配列へ分割する。
 * 空文字列は「0行」として扱う（AC3: 片方が空文字の場合、通常のdiffとして
 * 全行が追加/削除として検出されるようにするため）。
 */
export const splitLines = (text: string): string[] => {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  return normalized === '' ? [] : normalized.split('\n')
}

/**
 * Myers差分アルゴリズム（O((N+M)*D)）で2つの行配列間の最短編集スクリプトを求める。
 * 単純なO(N*M)の動的計画法（LCSテーブル）を避けることで、差分が少ない
 * 大きめの入力でもメモリ・計算量を抑える。
 */
const buildTrace = (a: string[], b: string[]): number[][] => {
  const n = a.length
  const m = b.length
  const max = n + m
  const offset = max
  const trace: number[][] = []

  if (max === 0) {
    return trace
  }

  const v = new Array<number>(2 * max + 1).fill(0)

  for (let d = 0; d <= max; d++) {
    trace.push(v.slice())

    for (let k = -d; k <= d; k += 2) {
      let x: number

      if (k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset])) {
        x = v[k + 1 + offset]
      } else {
        x = v[k - 1 + offset] + 1
      }

      let y = x - k

      while (x < n && y < m && a[x] === b[y]) {
        x += 1
        y += 1
      }

      v[k + offset] = x

      if (x >= n && y >= m) {
        return trace
      }
    }
  }

  return trace
}

/**
 * buildTraceで求めた編集距離の履歴をバックトラックし、
 * 行単位の追加・削除・共通行からなる編集スクリプトを構築する。
 */
export const diffLines = (a: string[], b: string[]): DiffOp[] => {
  const n = a.length
  const m = b.length

  if (n === 0 && m === 0) {
    return []
  }

  const max = n + m
  const offset = max
  const trace = buildTrace(a, b)
  const ops: DiffOp[] = []

  let x = n
  let y = m

  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d]
    const k = x - y

    let prevK: number
    if (k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset])) {
      prevK = k + 1
    } else {
      prevK = k - 1
    }

    const prevX = v[prevK + offset]
    const prevY = prevX - prevK

    while (x > prevX && y > prevY) {
      ops.push({ type: 'equal', text: a[x - 1] })
      x -= 1
      y -= 1
    }

    if (d > 0) {
      if (x === prevX) {
        ops.push({ type: 'add', text: b[y - 1] })
      } else {
        ops.push({ type: 'remove', text: a[x - 1] })
      }
    }

    x = prevX
    y = prevY
  }

  return ops.reverse()
}

export const diffPrefix = (type: DiffOpType): string => {
  if (type === 'add') {
    return '+'
  }

  if (type === 'remove') {
    return '-'
  }

  return ' '
}

export const opsToPlainText = (ops: DiffOp[]): string =>
  ops.map((op) => `${diffPrefix(op.type)}${op.text}`).join('\n')
