import { useRef, useState } from 'react'
import BrowserTool from '../../components/tools/BrowserTool'
import { useToolResult } from '../../components/tools/useToolResult'

import { validateHashSize, normalizeExpected, sha256Bytes, sha256Text } from './hash'

export default function Sha256() {
  const [mode, setMode] = useState('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [expected, setExpected] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const result = useToolResult()
  const supported = !!globalThis.crypto?.subtle && typeof TextEncoder !== 'undefined'

  const calculate = async () => {
    const normalized = normalizeExpected(expected)
    let hash: string
    if (mode === 'file') {
      if (!file) throw new Error('ファイルを選択してください。')
      validateHashSize(file.size)
      let buffer: ArrayBuffer
      try {
        buffer = await file.arrayBuffer()
      } catch {
        throw new Error('ファイルを読み込めませんでした。選択し直してください。')
      }
      hash = await sha256Bytes(buffer)
    } else {
      hash = await sha256Text(text)
    }
    return normalized ? `${hash}\n期待値との照合: ${hash === normalized ? '一致' : '不一致'}` : hash
  }

  return (
    <BrowserTool title="SHA-256ハッシュ計算" description="テキストやファイルのSHA-256を生成し、期待値と照合します。" result={result}
      onClear={() => {
        setMode('text'); setText(''); setFile(null); setExpected('')
        if (fileInput.current) fileInput.current.value = ''
        result.reset()
      }}
      usage={<>
        <p>テキストまたはファイルを選び、ハッシュ生成を押します。期待値は任意の64桁16進数で、前後の空白と英字の大小を無視して照合します。Copyは照合表示を含む出力全体をコピーします。</p>
        <p>テキストはUTF-8で符号化し、空白を削除せず、Unicode正規化やBOM追加をしません。テキスト欄の改行はブラウザによりLFになります。元ファイルのCRLFやBOMを含むバイト列をそのまま検証する場合はファイルを選んでください。空テキスト・空ファイルも計算できます。</p>
        <p>上限はテキストのUTF-8・ファイルとも20 MiB（20,971,520バイト）です。ファイルは全体をメモリへ読み込みます。HTTPSまたはlocalhostとWeb Crypto API対応ブラウザが必要です。入力変更やClear後には古い計算結果を表示しませんが、開始済みのブラウザ内部処理は中断できません。</p>
      </>}>
      {!supported && <p className="error-box" role="alert">この環境ではSHA-256を利用できません。HTTPSまたはlocalhostでWeb Crypto API・TextEncoder対応ブラウザを使用してください。</p>}
      <label className="field-label" htmlFor="hash-mode">入力形式</label>
      <select id="hash-mode" value={mode} onChange={event => { setMode(event.target.value); result.reset() }}>
        <option value="text">テキスト（UTF-8）</option><option value="file">ファイル</option>
      </select>
      {mode === 'text' ? <>
        <label className="field-label" htmlFor="hash-text">テキスト（空欄も計算可能）</label>
        <textarea id="hash-text" rows={8} value={text} spellCheck={false} onChange={event => { setText(event.target.value); result.reset() }} />
      </> : <>
        <label className="field-label" htmlFor="hash-file">ファイル（20 MiBまで）</label>
        <input id="hash-file" type="file" ref={fileInput} style={{ maxWidth: '100%', minWidth: 0 }} onChange={event => { setFile(event.target.files?.[0] ?? null); result.reset() }} />
      </>}
      <label className="field-label" htmlFor="hash-expected">期待するSHA-256（任意）</label>
      <input id="hash-expected" type="text" value={expected} spellCheck={false} onChange={event => { setExpected(event.target.value); result.reset() }} />
      <div className="action-row"><button type="button" className="primary-button" disabled={result.busy || !supported} onClick={() => void result.run(calculate)}>ハッシュ生成・照合</button></div>
    </BrowserTool>
  )
}
