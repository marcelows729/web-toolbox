import { useMemo, useRef, useState } from 'react'
import DatePartsInput, { composeIsoDate, type DatePartsValue } from '../../components/forms/DatePartsInput.tsx'
import { ERA_DEFINITIONS, gregorianToJapaneseEra, japaneseEraToGregorian, type EraName } from './japaneseEra'

type EraFormState = {
  era: EraName
  year: string
  month: string
  day: string
}

const initialEraForm: EraFormState = {
  era: '令和',
  year: '1',
  month: '1',
  day: '1',
}

export default function JapaneseEraConverter() {
  const [gregorianInput, setGregorianInput] = useState<DatePartsValue>({ year: '', month: '', day: '' })
  const [gregorianResult, setGregorianResult] = useState('')
  const [gregorianError, setGregorianError] = useState('')

  const monthInputRef = useRef<HTMLInputElement | null>(null)
  const dayInputRef = useRef<HTMLInputElement | null>(null)

  const [eraForm, setEraForm] = useState<EraFormState>(initialEraForm)
  const [eraResult, setEraResult] = useState('')
  const [eraError, setEraError] = useState('')

  const gregorianHasResult = useMemo(() => gregorianResult.length > 0, [gregorianResult])
  const eraHasResult = useMemo(() => eraResult.length > 0, [eraResult])

  const handleGregorianConvert = () => {
    const isoDate = composeIsoDate(gregorianInput)
    const result = gregorianToJapaneseEra(isoDate)

    if ('error' in result) {
      setGregorianResult('')
      setGregorianError(result.error)
      return
    }

    setGregorianError('')
    setGregorianResult(result.formatted)
  }

  const handleEraConvert = () => {
    const result = japaneseEraToGregorian(eraForm)

    if ('error' in result) {
      setEraResult('')
      setEraError(result.error)
      return
    }

    setEraError('')
    setEraResult(`${result.formatted} (${result.iso})`)
  }

  const handleGregorianClear = () => {
    setGregorianInput({ year: '', month: '', day: '' })
    setGregorianResult('')
    setGregorianError('')
  }

  const handleEraClear = () => {
    setEraForm(initialEraForm)
    setEraResult('')
    setEraError('')
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // no-op: copy not required for this pass
    }
  }

  return (
    <div className="container tool-page">
      <header className="tool-header">
        <h1>西暦・和暦変換</h1>
        <p>西暦と和暦を相互変換します。</p>
      </header>

      <section className="tool-panel" aria-label="西暦・和暦変換">
        <div className="date-calculator-layout">
          <div className="converter-card">
            <h2>西暦 → 和暦</h2>

            <label className="field-label" htmlFor="gregorian-date-input">
              西暦日付
            </label>
            <DatePartsInput
              id="gregorian-date-input"
              value={gregorianInput}
              onChange={setGregorianInput}
            />

            <div className="action-row">
              <button type="button" className="primary-button" onClick={handleGregorianConvert}>
                変換
              </button>
              <button type="button" className="secondary-button" onClick={handleGregorianClear}>
                Clear
              </button>
            </div>

            {gregorianError && <div className="error-box" role="alert">{gregorianError}</div>}

            {gregorianHasResult && (
              <div className="result-box" role="status" aria-live="polite">
                <div className="result-item">
                  <span className="result-label">和暦</span>
                  <div className="result-value-row">
                    <strong>{gregorianResult}</strong>
                    <button type="button" className="secondary small-button" onClick={() => handleCopy(gregorianResult)}>
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="converter-card">
            <h2>和暦 → 西暦</h2>

            <div className="date-calculator-pair-grid">
              <div className="date-field-group">
                <label className="field-label" htmlFor="era-select">
                  元号
                </label>
                <select
                  id="era-select"
                  value={eraForm.era}
                  onChange={(event) => setEraForm((current) => ({ ...current, era: event.target.value as EraName }))}
                >
                  {ERA_DEFINITIONS.map((era) => (
                    <option key={era.name} value={era.name}>
                      {era.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="date-field-group">
                <label className="field-label" htmlFor="era-year-input">
                  年
                </label>
                <input
                  id="era-year-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={eraForm.year}
                  onChange={(event) => {
                    const rawDigits = event.target.value.replace(/\D/g, '')
                    const yearPart = rawDigits.slice(0, 4)
                    const monthPart = rawDigits.slice(4, 6)
                    const dayPart = rawDigits.slice(6, 8)

                    setEraForm((current) => ({
                      ...current,
                      year: yearPart,
                      month: monthPart || current.month,
                      day: dayPart || current.day,
                    }))

                    if (yearPart.length === 4) {
                      window.setTimeout(() => {
                        monthInputRef.current?.focus()
                      }, 0)
                    }

                    if (monthPart.length === 2) {
                      window.setTimeout(() => {
                        dayInputRef.current?.focus()
                      }, 0)
                    }
                  }}
                />
              </div>

              <div className="date-field-group">
                <label className="field-label" htmlFor="era-month-input">
                  月
                </label>
                <input
                  ref={monthInputRef}
                  id="era-month-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  value={eraForm.month}
                  onChange={(event) => {
                    const nextValue = event.target.value.replace(/\D/g, '').slice(0, 2)

                    setEraForm((current) => ({ ...current, month: nextValue }))

                    if (nextValue.length === 2) {
                      window.setTimeout(() => {
                        dayInputRef.current?.focus()
                      }, 0)
                    }
                  }}
                />
              </div>

              <div className="date-field-group">
                <label className="field-label" htmlFor="era-day-input">
                  日
                </label>
                <input
                  ref={dayInputRef}
                  id="era-day-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  min={1}
                  max={31}
                  step={1}
                  value={eraForm.day}
                  onChange={(event) => setEraForm((current) => ({ ...current, day: event.target.value.replace(/\D/g, '').slice(0, 2) }))}
                />
              </div>
            </div>

            <div className="action-row">
              <button type="button" className="primary-button" onClick={handleEraConvert}>
                変換
              </button>
              <button type="button" className="secondary-button" onClick={handleEraClear}>
                Clear
              </button>
            </div>

            {eraError && <div className="error-box" role="alert">{eraError}</div>}

            {eraHasResult && (
              <div className="result-box" role="status" aria-live="polite">
                <div className="result-item">
                  <span className="result-label">西暦</span>
                  <div className="result-value-row">
                    <strong>{eraResult}</strong>
                    <button type="button" className="secondary small-button" onClick={() => handleCopy(eraResult)}>
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="tool-info">
        <h2>西暦・和暦変換とは</h2>
        <p>
          西暦・和暦変換は、西暦の日付を令和・平成・昭和などの和暦へ変換したり、和暦から西暦へ変換したりできるツールです。
          書類作成や日付確認などに利用できます。
        </p>
      </section>

      <section className="tool-info">
        <h2>使い方</h2>
        <ol>
          <li>西暦の日付を入力し、変換します。</li>
          <li>元号・年・月・日を入力し、和暦から西暦へ変換します。</li>
          <li>結果を確認して必要に応じてコピーします。</li>
        </ol>
      </section>

      <section className="tool-info">
        <h2>Privacy Information</h2>
        <p>このツールの処理はすべてブラウザ上で実行されます。入力したデータはサーバーへ送信されません。</p>
      </section>
    </div>
  )
}
