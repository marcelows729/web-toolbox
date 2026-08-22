import { useRef } from 'react'

export type DatePartsValue = {
  year: string
  month: string
  day: string
}

type DatePartsInputProps = {
  id: string
  value: DatePartsValue
  onChange: (nextValue: DatePartsValue) => void
  label?: string
}

const clampPart = (value: string, maxLength: number) => value.replace(/\D/g, '').slice(0, maxLength)

const normalizeDatePart = (value: string, digits: number) => {
  const sanitized = clampPart(value, digits)
  return sanitized
}

export const composeIsoDate = (parts: DatePartsValue) => {
  const year = parts.year.trim()
  const month = parts.month.trim()
  const day = parts.day.trim()

  if (!year && !month && !day) {
    return ''
  }

  const normalizedYear = year.slice(0, 4)
  const normalizedMonth = normalizeDatePart(month, 2)
  const normalizedDay = normalizeDatePart(day, 2)

  if (!normalizedYear || !normalizedMonth || !normalizedDay) {
    return ''
  }

  return `${normalizedYear}-${normalizedMonth.padStart(2, '0')}-${normalizedDay.padStart(2, '0')}`
}

export const parseIsoDateToParts = (value: string): DatePartsValue => {
  if (!value) {
    return { year: '', month: '', day: '' }
  }

  const [year = '', month = '', day = ''] = value.split('-')
  return {
    year: year.slice(0, 4),
    month: month.slice(0, 2),
    day: day.slice(0, 2),
  }
}

export default function DatePartsInput({
  id,
  value,
  onChange,
  label,
}: DatePartsInputProps) {
  const pickerRef = useRef<HTMLInputElement | null>(null)

  const openPicker = () => {
    const input = pickerRef.current

    if (!input) {
      return
    }

    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker()
      } catch {
        input.click()
      }
      return
    }

    input.click()
  }

  const handleBlur = (part: 'year' | 'month' | 'day', nextValue: string) => {
    const normalized = normalizeDatePart(nextValue, part === 'year' ? 4 : 2)
    onChange({ ...value, [part]: normalized })
  }

  const handlePartChange = (part: 'year' | 'month' | 'day', nextValue: string) => {
    const maxLength = part === 'year' ? 4 : 2
    onChange({ ...value, [part]: clampPart(nextValue, maxLength) })
  }

  const nativeDateValue = [value.year, value.month, value.day].every(Boolean)
    ? `${value.year}-${value.month.padStart(2, '0')}-${value.day.padStart(2, '0')}`
    : ''

  return (
    <div className="date-parts-input" aria-label={label ?? '日付'}>
      <div className="date-parts-field">
        <label htmlFor={`${id}-year`} className="field-label-sm">
          年
        </label>
        <input
          id={`${id}-year`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={value.year}
          onChange={(event) => handlePartChange('year', event.target.value)}
          onBlur={(event) => handleBlur('year', event.target.value)}
          aria-label="年"
          placeholder="2026"
        />
      </div>

      <div className="date-parts-field">
        <label htmlFor={`${id}-month`} className="field-label-sm">
          月
        </label>
        <input
          id={`${id}-month`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={value.month}
          onChange={(event) => handlePartChange('month', event.target.value)}
          onBlur={(event) => handleBlur('month', event.target.value)}
          aria-label="月"
          placeholder="10"
        />
      </div>

      <div className="date-parts-field">
        <label htmlFor={`${id}-day`} className="field-label-sm">
          日
        </label>
        <input
          id={`${id}-day`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={value.day}
          onChange={(event) => handlePartChange('day', event.target.value)}
          onBlur={(event) => handleBlur('day', event.target.value)}
          aria-label="日"
          placeholder="11"
        />
      </div>

      <input
        ref={pickerRef}
        type="date"
        value={nativeDateValue}
        onChange={(event) => {
          const next = event.target.value
          if (!next) {
            onChange({ year: '', month: '', day: '' })
            return
          }

          const [year, month, day] = next.split('-')
          onChange({ year: year ?? '', month: month ?? '', day: day ?? '' })
        }}
        aria-hidden="true"
        tabIndex={-1}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />

      <button
        type="button"
        className="secondary small-button icon-button calendar-trigger"
        aria-label="カレンダーから日付を選択"
        title="カレンダーから日付を選択"
        onClick={openPicker}
      >
        <svg
          className="calendar-trigger-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M7 2.75a.75.75 0 0 1 .75.75V4h8.5V3.5a.75.75 0 0 1 1.5 0V4h1.25A2.75 2.75 0 0 1 21.75 6.75v11.5A2.75 2.75 0 0 1 19 21H5A2.75 2.75 0 0 1 2.25 18.25V6.75A2.75 2.75 0 0 1 5 4h1.25V3.5A.75.75 0 0 1 7 2.75Zm-1.25 6.5h13.5v-2.5H5.75v2.5Zm13.5 1.5H5.75v7.5c0 .69.56 1.25 1.25 1.25h11.5c.69 0 1.25-.56 1.25-1.25v-7.5Z" />
        </svg>
      </button>
    </div>
  )
}
