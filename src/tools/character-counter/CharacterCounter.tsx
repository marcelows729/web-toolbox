import { useMemo, useState } from 'react'

type CountSummary = {
  totalCharacters: number
  withoutWhitespace: number
  lines: number
  words: number
  utf8Bytes: number
}

const getGraphemeLength = (text: string) => {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      return Array.from(segmenter.segment(text), (segment) => segment.segment).length
    } catch {
      // Fallback to Array.from when Segmenter is unavailable or rejected.
    }
  }

  return Array.from(text).length
}

const countWords = (text: string) => {
  const trimmed = text.trim()
  if (!trimmed) {
    return 0
  }

  return trimmed.split(/\s+/).filter((word) => word.length > 0).length
}

const countLines = (text: string) => {
  if (!text) {
    return 0
  }

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const newlineCount = (normalized.match(/\n/g) || []).length
  return newlineCount + 1
}

const countWithoutWhitespace = (text: string) => {
  const withoutWhitespace = text.replace(/[\s\u3000\t\n\r]/g, '')
  return getGraphemeLength(withoutWhitespace)
}

const countUtf8Bytes = (text: string) => new TextEncoder().encode(text).length

export default function CharacterCounter() {
  const [input, setInput] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')

  const summary = useMemo<CountSummary>(() => {
    if (!input) {
      return {
        totalCharacters: 0,
        withoutWhitespace: 0,
        lines: 0,
        words: 0,
        utf8Bytes: 0,
      }
    }

    return {
      totalCharacters: getGraphemeLength(input),
      withoutWhitespace: countWithoutWhitespace(input),
      lines: countLines(input),
      words: countWords(input),
      utf8Bytes: countUtf8Bytes(input),
    }
  }, [input])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(input)
      setCopyFeedback('入力テキストをコピーしました')
    } catch {
      setCopyFeedback('コピーに失敗しました')
    }
  }

  const handleClear = () => {
    setInput('')
    setCopyFeedback('')
  }

  return (
    <div className="container tool-page">
      <header className="tool-header">
        <h1>文字数カウンター</h1>
        <p>入力したテキストの文字数・行数・単語数・バイト数をリアルタイムで確認します。</p>
      </header>

      <section className="tool-panel" aria-label="文字数カウンター">
        <label className="field-label" htmlFor="character-counter-input">
          Text
        </label>
        <textarea
          id="character-counter-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="ここに文字数を数えたいテキストを入力してください。"
          rows={12}
        />

        <div className="action-row">
          <button type="button" className="secondary-button" onClick={handleClear}>
            Clear
          </button>
          <button type="button" className="secondary-button" onClick={handleCopy} disabled={!input.trim()}>
            Copy
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">文字数</span>
            <strong>{summary.totalCharacters}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">空白除外</span>
            <strong>{summary.withoutWhitespace}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">行数</span>
            <strong>{summary.lines}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">単語数</span>
            <strong>{summary.words}</strong>
          </div>
          <div className="stat-card stat-card--wide">
            <span className="stat-label">UTF-8</span>
            <strong>{summary.utf8Bytes} bytes</strong>
          </div>
        </div>

        {copyFeedback && (
          <div className="copy-feedback" role="status" aria-live="polite">
            {copyFeedback}
          </div>
        )}
      </section>

      <section className="tool-info">
        <h2>文字数カウンターとは</h2>
        <p>
          文字数カウンターは、入力した文章の文字数・行数・単語数・UTF-8バイト数をリアルタイムで確認できるツールです。
          レポート、SNS投稿、原稿、フォーム入力、開発時のデータ確認などに利用できます。
        </p>
      </section>

      <section className="tool-info">
        <h2>使い方</h2>
        <ol>
          <li>テキストを入力または貼り付けます。</li>
          <li>文字数などがリアルタイムで表示されます。</li>
          <li>単語数はスペース等で区切られた語を基準に計算します。</li>
          <li>必要に応じてClearで入力を削除します。</li>
        </ol>
      </section>

      <section className="tool-info">
        <h2>Privacy Information</h2>
        <p>このツールの処理はすべてブラウザ上で実行されます。入力したデータはサーバーへ送信されません。</p>
      </section>
    </div>
  )
}
