import { useRef } from 'react'

import { sanitizeDateTimeTextValue } from '../../utils/dateInputValidation.ts'

type DateTimeInputProps = {
  id: string
  value: string
  onChange: (nextValue: string) => void
  label?: string
  placeholder?: string
  className?: string
  showCurrent?: boolean
  onCurrent?: () => void
}

export default function DateTimeInput({
  id,
  value,
  onChange,
  label,
  placeholder = 'YYYY-MM-DDTHH:mm',
  className,
  showCurrent = false,
  onCurrent,
}: DateTimeInputProps) {
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

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeDateTimeTextValue(event.target.value)
    onChange(nextValue)
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text')

    if (!pasted) {
      return
    }

    const cleaned = pasted.replace(/[^\dT:-]/g, '')

    if (!cleaned) {
      event.preventDefault()
      return
    }

    const [datePart = ''] = cleaned.split('T')
    const yearPart = datePart.split('-')[0] ?? ''

    if (yearPart.length > 4) {
      event.preventDefault()
      return
    }

    if (!/^\d{1,4}(?:-\d{0,2}){0,2}(?:T\d{0,2}(?::\d{0,2})?:?)?$/.test(cleaned)) {
      event.preventDefault()
      return
    }
  }

  return (
    <div className={className ?? 'date-input-row'}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleTextChange}
        onPaste={handlePaste}
        placeholder={placeholder}
        aria-label={label ?? '日時'}
        inputMode="numeric"
      />

      <input
        ref={pickerRef}
        type="datetime-local"
        value={/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value) ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        aria-hidden="true"
        tabIndex={-1}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />

      <button
        type="button"
        className="secondary small-button icon-button calendar-trigger"
        aria-label="カレンダーから日時を選択"
        title="カレンダーから日時を選択"
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

      {showCurrent && onCurrent && (
        <button type="button" className="secondary small-button" onClick={onCurrent}>
          現在時刻
        </button>
      )}
    </div>
  )
}
