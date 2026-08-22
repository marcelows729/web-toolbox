import { useMemo, useState } from 'react'
import QRCode from 'qrcode'

export default function QrCodeGenerator() {
  const [input, setInput] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const canDownload = useMemo(() => qrDataUrl.length > 0, [qrDataUrl])

  const handleGenerate = async () => {
    const trimmed = input.trim()

    if (!trimmed) {
      setQrDataUrl('')
      setStatus('')
      setError('URLやテキストを入力してください。')
      return
    }

    try {
      const dataUrl = await QRCode.toDataURL(trimmed, {
        errorCorrectionLevel: 'M',
        margin: 2,
        scale: 8,
        width: 256,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })

      setQrDataUrl(dataUrl)
      setError('')
      setStatus('QRコードを生成しました。')
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'QRコードの生成に失敗しました。'
      setQrDataUrl('')
      setStatus('')
      setError(message)
    }
  }

  const handleClear = () => {
    setInput('')
    setQrDataUrl('')
    setError('')
    setStatus('')
  }

  const handleInputChange = (nextValue: string) => {
    setInput(nextValue)

    if (qrDataUrl) {
      setQrDataUrl('')
      setStatus('')
    }

    if (error) {
      setError('')
    }
  }

  const handleDownload = () => {
    if (!qrDataUrl) {
      return
    }

    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = 'poketsuru-qr.png'
    link.click()
  }

  return (
    <div className="container tool-page">
      <header className="tool-header">
        <h1>QRコード生成</h1>
        <p>URLやテキストからQRコードを生成します。</p>
      </header>

      <section className="tool-panel" aria-label="QRコード生成">
        <div className="qr-generator-layout">
          <div className="qr-generator-main">
            <label className="field-label" htmlFor="qr-generator-input">
              URLまたはテキスト
            </label>
            <textarea
              id="qr-generator-input"
              value={input}
              onChange={(event) => handleInputChange(event.target.value)}
              placeholder="URLやテキストを入力してください。\n例: https://poketsuru.com\nまたは: こんにちは"
              rows={10}
            />

            <div className="action-row">
              <button type="button" className="primary-button" onClick={handleGenerate}>
                生成
              </button>
              <button type="button" className="secondary-button" onClick={handleClear}>
                Clear
              </button>
            </div>

            {error && <div className="error-box" role="alert">{error}</div>}
            {status && (
              <div className="copy-feedback" role="status" aria-live="polite">
                {status}
              </div>
            )}
          </div>

          <div className="qr-preview-panel">
            <div className="qr-preview-header">
              <span className="field-label">QR Preview</span>
            </div>

            <div className="qr-preview-shell" aria-label="生成されたQRコード">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="生成されたQRコード" className="qr-preview-image" />
              ) : (
                <div className="qr-preview-placeholder">QRコードがここに表示されます</div>
              )}
            </div>

            <button type="button" className="secondary-button" onClick={handleDownload} disabled={!canDownload}>
              PNGを保存
            </button>
          </div>
        </div>
      </section>

      <section className="tool-info">
        <h2>QRコード生成とは</h2>
        <p>
          QRコード生成は、URLやテキストからQRコードを作成できるツールです。WebサイトURLの共有や、テキスト情報をスマートフォンへ渡したい場合などに利用できます。生成処理はブラウザ上で行われます。
        </p>
      </section>

      <section className="tool-info">
        <h2>使い方</h2>
        <ol>
          <li>URLまたはテキストを入力します。</li>
          <li>「生成」を押します。</li>
          <li>QRコードを確認します。</li>
          <li>必要に応じてPNG画像として保存します。</li>
        </ol>
      </section>

      <section className="tool-info">
        <h2>Privacy Information</h2>
        <p>このツールの処理はすべてブラウザ上で実行されます。入力したデータはサーバーへ送信されません。</p>
      </section>
    </div>
  )
}
