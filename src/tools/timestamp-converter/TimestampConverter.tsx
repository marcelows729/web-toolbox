import { useState } from 'react'
import { useClipboardFeedback } from '../../components/tools/useClipboardFeedback'
import DatePartsInput from '../../components/forms/DatePartsInput.tsx'
import { composeIsoDate, type DatePartsValue } from '../../components/forms/dateParts'
import { getFourDigitYearError } from '../../utils/dateInputValidation.ts'

type TimestampUnit = 'seconds' | 'milliseconds'
type DateInterpretation = 'local' | 'utc'

type TimestampResult = {
  local: string
  utc: string
}

type DatetimeResult = {
  seconds: string
  milliseconds: string
}

const pad = (value: number) => String(value).padStart(2, '0')

const formatDateTime = (date: Date, mode: 'local' | 'utc') => {
  if (mode === 'utc') {
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const formatLocalTimeInput = (date: Date) => {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const isNumericString = (value: string) => {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return false
  }

  return /^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed) && Number.isFinite(Number(trimmed))
}

const parseDatetimeLocalValue = (value: string, interpretation: DateInterpretation) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)

  if (!match) {
    return null
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText = '00'] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const second = Number(secondText)

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) {
    return null
  }

  if (interpretation === 'utc') {
    const timestamp = Date.UTC(year, month - 1, day, hour, minute, second)
    return new Date(timestamp)
  }

  return new Date(year, month - 1, day, hour, minute, second)
}

const isValidTimeValue = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim())

export default function TimestampConverter() {
  const [timestampInput, setTimestampInput] = useState('')
  const [timestampUnit, setTimestampUnit] = useState<TimestampUnit>('seconds')
  const [timestampResult, setTimestampResult] = useState<TimestampResult | null>(null)
  const [timestampError, setTimestampError] = useState('')

  const [datetimeDate, setDatetimeDate] = useState<DatePartsValue>({ year: '', month: '', day: '' })
  const [datetimeTime, setDatetimeTime] = useState('')
  const [datetimeInterpretation, setDatetimeInterpretation] = useState<DateInterpretation>('local')
  const [datetimeResult, setDatetimeResult] = useState<DatetimeResult | null>(null)
  const [datetimeError, setDatetimeError] = useState('')
  const { feedback: copyFeedback, reset: resetCopy, copy } = useClipboardFeedback(1800)
  const resetTimestampResult = () => { setTimestampResult(null); setTimestampError(''); resetCopy() }
  const resetDatetimeResult = () => { setDatetimeResult(null); setDatetimeError(''); resetCopy() }

  const handleTimestampConvert = () => {
    resetTimestampResult()
    const trimmed = timestampInput.trim()

    if (!trimmed) {
      setTimestampError('Timestampを入力してください。')
      setTimestampResult(null)
      return
    }

    if (!isNumericString(trimmed)) {
      setTimestampError('Timestampは数値で入力してください。')
      setTimestampResult(null)
      return
    }

    const numericValue = Number(trimmed)
    const milliseconds = timestampUnit === 'seconds' ? numericValue * 1000 : numericValue
    const date = new Date(milliseconds)

    if (Number.isNaN(date.getTime())) {
      setTimestampError('Dateとして扱えないTimestampです。')
      setTimestampResult(null)
      return
    }

    setTimestampError('')
    setTimestampResult({
      local: formatDateTime(date, 'local'),
      utc: formatDateTime(date, 'utc'),
    })
  }

  const handleDatetimeConvert = () => {
    resetDatetimeResult()
    const trimmedDate = composeIsoDate(datetimeDate)
    const trimmedTime = datetimeTime.trim()

    if (!trimmedDate || !trimmedTime) {
      setDatetimeError('日付と時刻を入力してください。')
      setDatetimeResult(null)
      return
    }

    const yearError = getFourDigitYearError(trimmedDate)
    if (yearError) {
      setDatetimeError(yearError)
      setDatetimeResult(null)
      return
    }

    if (!isValidTimeValue(trimmedTime)) {
      setDatetimeError('時刻は HH:mm 形式で入力してください。')
      setDatetimeResult(null)
      return
    }

    const combinedValue = `${trimmedDate}T${trimmedTime}`
    const date = parseDatetimeLocalValue(combinedValue, datetimeInterpretation)

    if (!date || Number.isNaN(date.getTime())) {
      setDatetimeError('日時の形式が正しくありません。')
      setDatetimeResult(null)
      return
    }

    const milliseconds = date.getTime()
    const seconds = Math.floor(milliseconds / 1000)

    setDatetimeError('')
    setDatetimeResult({
      seconds: String(seconds),
      milliseconds: String(milliseconds),
    })
  }

  const handleCurrentTime = () => {
    resetDatetimeResult()
    const now = new Date()
    setDatetimeDate({
      year: String(now.getFullYear()),
      month: String(now.getMonth() + 1),
      day: String(now.getDate()),
    })
    setDatetimeTime(formatLocalTimeInput(now))
  }

  const handleCurrentTimestamp = () => {
    resetTimestampResult()
    const currentTimestamp = timestampUnit === 'seconds' ? Math.floor(Date.now() / 1000) : Date.now()
    setTimestampInput(String(currentTimestamp))
  }

  const handleCopy = (value: string, label: string) => { void copy(value, `${label}をコピーしました`) }

  const handleTimestampClear = () => {
    setTimestampInput('')
    setTimestampUnit('seconds')
    setTimestampResult(null)
    setTimestampError('')
    resetCopy()
  }

  const handleDatetimeClear = () => {
    setDatetimeDate({ year: '', month: '', day: '' })
    setDatetimeTime('')
    setDatetimeInterpretation('local')
    setDatetimeResult(null)
    setDatetimeError('')
    resetCopy()
  }

  const handleClearAll = () => {
    handleTimestampClear()
    handleDatetimeClear()
  }

  return (
    <div className="container tool-page">
      <header className="tool-header">
        <h1>Timestamp Converter</h1>
        <p>Unix Timestampと日時を相互変換します。</p>
      </header>

      <section className="tool-panel" aria-label="Timestamp Converter">
        <div className="timestamp-grid">
          <div className="converter-card">
            <h2>Timestamp → 日時</h2>

            <label className="field-label" htmlFor="timestamp-input">
              Timestamp
            </label>
            <input aria-describedby={timestampError ? 'timestamp-error' : undefined}
              id="timestamp-input"
              type="text"
              value={timestampInput}
              onChange={(event) => { setTimestampInput(event.target.value); resetTimestampResult() }}
              placeholder="1704067200"
            />

            <div className="input-row compact-row">
              <div className="option-group">
                <span className="option-label">Unit</span>
                <div className="toggle-group" role="radiogroup" aria-label="Timestamp unit selection">
                  <button
                    type="button"
                    className={`toggle-option ${timestampUnit === 'seconds' ? 'is-selected' : ''}`}
                    onClick={() => { if (timestampUnit !== 'seconds') { setTimestampUnit('seconds'); resetTimestampResult() } }}
                    aria-pressed={timestampUnit === 'seconds'}
                  >
                    秒
                  </button>
                  <button
                    type="button"
                    className={`toggle-option ${timestampUnit === 'milliseconds' ? 'is-selected' : ''}`}
                    onClick={() => { if (timestampUnit !== 'milliseconds') { setTimestampUnit('milliseconds'); resetTimestampResult() } }}
                    aria-pressed={timestampUnit === 'milliseconds'}
                  >
                    ミリ秒
                  </button>
                </div>
              </div>

              <button type="button" className="secondary small-button" onClick={handleCurrentTimestamp}>
                現在Timestamp
              </button>
            </div>

            <div className="action-row">
              <button type="button" className="primary-button" onClick={handleTimestampConvert}>
                変換
              </button>
              <button type="button" className="secondary-button" onClick={handleTimestampClear}>
                Clear
              </button>
            </div>

            {timestampError && <div className="error-box" role="alert" id="timestamp-error">{timestampError}</div>}

            {timestampResult && (
              <div className="result-box">
                <div className="result-item">
                  <span className="result-label">Local</span>
                  <div className="result-value-row">
                    <strong>{timestampResult.local}</strong>
                    <button
                      type="button"
                      className="secondary small-button"
                      onClick={() => handleCopy(timestampResult.local, 'Local datetime')}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="result-item">
                  <span className="result-label">UTC</span>
                  <div className="result-value-row">
                    <strong>{timestampResult.utc}</strong>
                    <button
                      type="button"
                      className="secondary small-button"
                      onClick={() => handleCopy(timestampResult.utc, 'UTC datetime')}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="converter-card">
            <h2>日時 → Timestamp</h2>

            <div className="date-time-field-row">
              <div className="time-field-group">
                <span className="subfield-label" id="datetime-date-label">日付</span>
                <DatePartsInput
                  id="datetime-date-input" labelledBy="datetime-date-label" describedBy={datetimeError ? 'datetime-error' : undefined}
                  value={datetimeDate}
                  onChange={(next) => { if (next.year !== datetimeDate.year || next.month !== datetimeDate.month || next.day !== datetimeDate.day) resetDatetimeResult(); setDatetimeDate(next) }}
                />
              </div>

              <div className="time-field-group">
                <span className="subfield-label">時刻</span>
                <input aria-describedby={datetimeError ? 'datetime-error' : undefined}
                  id="datetime-time-input"
                  type="time"
                  value={datetimeTime}
                  onChange={(event) => { setDatetimeTime(event.target.value); resetDatetimeResult() }}
                  step={60}
                  aria-label="時刻"
                />
              </div>
            </div>

            <div className="input-row compact-row">
              <button type="button" className="secondary small-button" onClick={handleCurrentTime}>
                現在時刻
              </button>
            </div>

            <div className="input-row compact-row">
              <div className="option-group">
                <span className="option-label">Interpret as</span>
                <div className="toggle-group" role="radiogroup" aria-label="Datetime interpretation">
                  <button
                    type="button"
                    className={`toggle-option ${datetimeInterpretation === 'local' ? 'is-selected' : ''}`}
                    onClick={() => { if (datetimeInterpretation !== 'local') { setDatetimeInterpretation('local'); resetDatetimeResult() } }}
                    aria-pressed={datetimeInterpretation === 'local'}
                  >
                    Local
                  </button>
                  <button
                    type="button"
                    className={`toggle-option ${datetimeInterpretation === 'utc' ? 'is-selected' : ''}`}
                    onClick={() => { if (datetimeInterpretation !== 'utc') { setDatetimeInterpretation('utc'); resetDatetimeResult() } }}
                    aria-pressed={datetimeInterpretation === 'utc'}
                  >
                    UTC
                  </button>
                </div>
              </div>
            </div>

            <div className="action-row">
              <button type="button" className="primary-button" onClick={handleDatetimeConvert}>
                変換
              </button>
              <button type="button" className="secondary-button" onClick={handleDatetimeClear}>
                Clear
              </button>
            </div>

            {datetimeError && <div className="error-box" role="alert" id="datetime-error">{datetimeError}</div>}

            {datetimeResult && (
              <div className="result-box">
                <div className="result-item">
                  <span className="result-label">秒</span>
                  <div className="result-value-row">
                    <strong>{datetimeResult.seconds}</strong>
                    <button
                      type="button"
                      className="secondary small-button"
                      onClick={() => handleCopy(datetimeResult.seconds, 'Seconds timestamp')}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="result-item">
                  <span className="result-label">ミリ秒</span>
                  <div className="result-value-row">
                    <strong>{datetimeResult.milliseconds}</strong>
                    <button
                      type="button"
                      className="secondary small-button"
                      onClick={() => handleCopy(datetimeResult.milliseconds, 'Milliseconds timestamp')}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="global-clear-row">
          <button type="button" className="secondary-button" onClick={handleClearAll}>
            全てクリア
          </button>
        </div>

        {copyFeedback && (
          <div className="copy-feedback" role="status" aria-live="polite">
            {copyFeedback}
          </div>
        )}
      </section>

      <section className="tool-info">
        <h2>Timestamp Converterとは</h2>
        <p>
          Timestamp Converterは、Unix Timestampと日時を相互変換するツールです。
          Unix Timestampの秒・ミリ秒変換や、UTCとローカル時刻の確認に利用できます。
        </p>
      </section>

      <section className="tool-info">
        <h2>使い方</h2>
        <ol>
          <li>Timestampを入力し、秒またはミリ秒を選択して変換します。</li>
          <li>日時欄に入力し、LocalまたはUTCを選択して変換します。</li>
          <li>変換結果の値をコピーして利用します。</li>
          <li>必要に応じてClearで入力と結果を初期化します。</li>
        </ol>
      </section>

      <section className="tool-info">
        <h2>Privacy Information</h2>
        <p>
          このツールの処理はすべてブラウザ上で実行されます。入力したデータはサーバーへ送信されません。
        </p>
      </section>
    </div>
  )
}
