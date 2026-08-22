import { useMemo, useState } from 'react'
import DatePartsInput, { composeIsoDate, type DatePartsValue } from '../../components/forms/DatePartsInput.tsx'
import { getFourDigitYearError } from '../../utils/dateInputValidation.ts'

type Direction = 'after' | 'before'

const DAY_IN_MS = 24 * 60 * 60 * 1000

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseUtcDate = (value: string): Date | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }

  return parsed
}

const getSignedDayDifference = (start: string, end: string) => {
  const startDate = parseUtcDate(start)
  const endDate = parseUtcDate(end)

  if (!startDate || !endDate) {
    return null
  }

  return Math.round((endDate.getTime() - startDate.getTime()) / DAY_IN_MS)
}

const getInclusiveDayCount = (start: string, end: string) => {
  const diff = getSignedDayDifference(start, end)

  if (diff === null) {
    return null
  }

  return Math.abs(diff) + 1
}

const validateDayCount = (value: string) => {
  const trimmed = value.trim()

  if (trimmed === '') {
    return '日数を入力してください。'
  }

  if (!/^\d+$/.test(trimmed)) {
    return '日数は0以上の整数で入力してください。'
  }

  const parsed = Number(trimmed)

  if (!Number.isInteger(parsed)) {
    return '日数は整数で入力してください。'
  }

  if (parsed < 0) {
    return '日数は0以上で入力してください。'
  }

  return parsed
}

const formatDayDifference = (value: number) => {
  if (value === 0) {
    return '0日'
  }

  if (value > 0) {
    return `${value}日`
  }

  return `${Math.abs(value)}日前`
}

const formatDateWithWeekday = (value: string) => {
  const parsed = parseUtcDate(value)

  if (!parsed) {
    return value
  }

  const date = new Date(parsed.getTime())
  const weekday = new Intl.DateTimeFormat('ja-JP', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(date)

  return `${value}（${weekday}）`
}

export default function DateCalculator() {
  const [startDate, setStartDate] = useState<DatePartsValue>({ year: '', month: '', day: '' })
  const [endDate, setEndDate] = useState<DatePartsValue>({ year: '', month: '', day: '' })
  const [dateDifferenceResult, setDateDifferenceResult] = useState('')
  const [dateInclusiveResult, setDateInclusiveResult] = useState('')
  const [dateError, setDateError] = useState('')

  const [baseDate, setBaseDate] = useState<DatePartsValue>({ year: '', month: '', day: '' })
  const [dayOffset, setDayOffset] = useState('0')
  const [direction, setDirection] = useState<Direction>('after')
  const [offsetResult, setOffsetResult] = useState('')
  const [offsetError, setOffsetError] = useState('')

  const hasDateResult = useMemo(() => dateDifferenceResult.length > 0 || dateInclusiveResult.length > 0, [dateDifferenceResult, dateInclusiveResult])
  const hasOffsetResult = useMemo(() => offsetResult.length > 0, [offsetResult])

  const handleDateDifferenceCalculate = () => {
    const startIso = composeIsoDate(startDate)
    const endIso = composeIsoDate(endDate)

    if (!startIso) {
      setDateError('開始日を入力してください。')
      setDateDifferenceResult('')
      setDateInclusiveResult('')
      return
    }

    if (!endIso) {
      setDateError('終了日を入力してください。')
      setDateDifferenceResult('')
      setDateInclusiveResult('')
      return
    }

    const startYearError = getFourDigitYearError(startIso)
    if (startYearError) {
      setDateError(startYearError)
      setDateDifferenceResult('')
      setDateInclusiveResult('')
      return
    }

    const endYearError = getFourDigitYearError(endIso)
    if (endYearError) {
      setDateError(endYearError)
      setDateDifferenceResult('')
      setDateInclusiveResult('')
      return
    }

    const diff = getSignedDayDifference(startIso, endIso)

    if (diff === null) {
      setDateError('日付の形式が正しくありません。')
      setDateDifferenceResult('')
      setDateInclusiveResult('')
      return
    }

    const inclusive = getInclusiveDayCount(startIso, endIso)

    if (inclusive === null) {
      setDateError('日付の形式が正しくありません。')
      setDateDifferenceResult('')
      setDateInclusiveResult('')
      return
    }

    setDateError('')
    setDateDifferenceResult(formatDayDifference(diff))
    setDateInclusiveResult(`${inclusive}日`)
  }

  const handleOffsetCalculate = () => {
    const baseIsoDate = composeIsoDate(baseDate)

    if (!baseIsoDate) {
      setOffsetError('基準日を入力してください。')
      setOffsetResult('')
      return
    }

    const baseYearError = getFourDigitYearError(baseIsoDate)
    if (baseYearError) {
      setOffsetError(baseYearError)
      setOffsetResult('')
      return
    }

    const validationResult = validateDayCount(dayOffset)
    if (typeof validationResult === 'string') {
      setOffsetError(validationResult)
      setOffsetResult('')
      return
    }

    const baseDateValue = parseUtcDate(baseIsoDate)
    if (!baseDateValue) {
      setOffsetError('基準日の形式が正しくありません。')
      setOffsetResult('')
      return
    }

    const offsetValue = validationResult
    const delta = direction === 'after' ? offsetValue : -offsetValue
    const nextDate = new Date(baseDateValue.getTime() + delta * DAY_IN_MS)

    if (Number.isNaN(nextDate.getTime())) {
      setOffsetError('計算できない日付です。')
      setOffsetResult('')
      return
    }

    setOffsetError('')
    setOffsetResult(formatDateWithWeekday(formatLocalDate(nextDate)))
  }

  const handleDateClear = () => {
    setStartDate({ year: '', month: '', day: '' })
    setEndDate({ year: '', month: '', day: '' })
    setDateDifferenceResult('')
    setDateInclusiveResult('')
    setDateError('')
  }

  const handleOffsetClear = () => {
    setBaseDate({ year: '', month: '', day: '' })
    setDayOffset('0')
    setDirection('after')
    setOffsetResult('')
    setOffsetError('')
  }

  return (
    <div className="container tool-page">
      <header className="tool-header">
        <h1>日付・日数計算</h1>
        <p>2つの日付の間の日数や、指定した日付から○日後・○日前の日付を計算します。</p>
      </header>

      <section className="tool-panel" aria-label="日付・日数計算">
        <div className="date-calculator-layout">
          <div className="converter-card">
            <h2>日付間の日数計算</h2>

            <div className="date-calculator-pair-grid">
              <div className="date-field-group">
                <label className="field-label" htmlFor="date-start">
                  開始日
                </label>
                <div className="date-input-row">
                  <DatePartsInput
                    id="date-start"
                    value={startDate}
                    onChange={setStartDate}
                  />
                </div>
              </div>

              <div className="date-field-group">
                <label className="field-label" htmlFor="date-end">
                  終了日
                </label>
                <div className="date-input-row">
                  <DatePartsInput
                    id="date-end"
                    value={endDate}
                    onChange={setEndDate}
                  />
                </div>
              </div>
            </div>

            <div className="action-row">
              <button type="button" className="date-calculator-primary-button" onClick={handleDateDifferenceCalculate}>計算</button>
              <button type="button" className="secondary date-calculator-secondary-button" onClick={handleDateClear}>Clear</button>
            </div>

            {hasDateResult && (
              <div className="result-box" role="status" aria-live="polite">
                <div className="result-item">
                  <span className="result-label">日付の差</span>
                  <div className="result-value-row">
                    <strong>{dateDifferenceResult}</strong>
                  </div>
                </div>
                <div className="result-item">
                  <span className="result-label">開始日・終了日を含む</span>
                  <div className="result-value-row">
                    <strong>{dateInclusiveResult}</strong>
                  </div>
                </div>
              </div>
            )}
            {dateError && <div className="error-box" role="alert">{dateError}</div>}
          </div>

          <div className="converter-card">
            <h2>○日後 / ○日前</h2>

            <div className="offset-input-grid">
              <div className="date-field-group">
                <label className="field-label" htmlFor="base-date">
                  基準日
                </label>
                <div className="date-input-row">
                  <DatePartsInput
                    id="base-date"
                    value={baseDate}
                    onChange={setBaseDate}
                  />
                </div>
              </div>

              <div className="offset-field-group">
                <label className="field-label" htmlFor="day-offset">
                  日数
                </label>
                <input
                  id="day-offset"
                  type="number"
                  min={0}
                  step={1}
                  value={dayOffset}
                  onChange={(event) => setDayOffset(event.target.value)}
                />
              </div>

              <div className="offset-direction-group">
                <span className="option-label">方向</span>
                <div className="toggle-group" role="radiogroup" aria-label="日数の方向">
                  <button
                    type="button"
                    className={`toggle-option date-calculator-toggle-option ${direction === 'after' ? 'is-selected date-calculator-toggle-option--selected' : ''}`}
                    onClick={() => setDirection('after')}
                    aria-pressed={direction === 'after'}
                  >
                    ○日後
                  </button>
                  <button
                    type="button"
                    className={`toggle-option date-calculator-toggle-option ${direction === 'before' ? 'is-selected date-calculator-toggle-option--selected' : ''}`}
                    onClick={() => setDirection('before')}
                    aria-pressed={direction === 'before'}
                  >
                    ○日前
                  </button>
                </div>
              </div>
            </div>

            <div className="action-row">
              <button type="button" className="date-calculator-primary-button" onClick={handleOffsetCalculate}>計算</button>
              <button type="button" className="secondary date-calculator-secondary-button" onClick={handleOffsetClear}>Clear</button>
            </div>

            {hasOffsetResult && (
              <div className="result-box" role="status" aria-live="polite">
                <div className="result-item">
                  <span className="result-label">計算結果</span>
                  <div className="result-value-row">
                    <strong>{offsetResult}</strong>
                  </div>
                </div>
              </div>
            )}
            {offsetError && <div className="error-box" role="alert">{offsetError}</div>}
          </div>
        </div>
      </section>

      <section className="tool-info">
        <h2>日付・日数計算とは</h2>
        <p>
          日付・日数計算は、2つの日付の間の日数を調べたり、指定した日付から○日後・○日前の日付を計算したりできるツールです。
          予定、期限、旅行、イベント、仕事のスケジュールなどの日付計算に利用できます。
        </p>
      </section>

      <section className="tool-info">
        <h2>「日付の差」と「開始日・終了日を含む」の違い</h2>
        <p>
          「日付の差」は、開始日から終了日までに経過する日数です。
          「開始日・終了日を含む」は、開始日と終了日の両方を1日として数えます。
        </p>
      </section>

      <section className="tool-info">
        <h2>使い方</h2>
        <ol>
          <li>開始日と終了日を入力します。</li>
          <li>計算して、日付の差と両端を含む日数を確認します。</li>
          <li>または、基準日と日数を入力して○日後 / ○日前を計算します。</li>
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
