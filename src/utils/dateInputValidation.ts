export const isFourDigitYear = (value: string) => /^\d{4}$/.test(value)

const normalizeDateSegment = (value: string, segmentLength: number) => {
  const digits = value.replace(/\D/g, '').slice(0, segmentLength)
  return digits
}

export const sanitizePartialDateInput = (value: string) => {
  const cleaned = value.replace(/[^\d-]/g, '')

  if (!cleaned) {
    return ''
  }

  const segments = cleaned.split('-')
  const year = (segments[0] ?? '').replace(/\D/g, '').slice(0, 4)
  const month = (segments[1] ?? '').replace(/\D/g, '').slice(0, 2)
  const day = (segments[2] ?? '').replace(/\D/g, '').slice(0, 2)

  if (segments.length === 1) {
    return year
  }

  if (segments.length === 2) {
    if (segments[1] === '') {
      return `${year}-`
    }

    return `${year}-${month}`
  }

  if (segments[2] === '') {
    return `${year}-${month}-`
  }

  return `${year}-${month}-${day}`
}

export const sanitizePartialDateTimeInput = (value: string) => {
  const normalized = value.replace(/\s+/g, 'T').replace(/[^\dT:-]/g, '')

  if (!normalized) {
    return ''
  }

  const [rawDatePart = '', rawTimePart = ''] = normalized.split('T')
  const dateText = sanitizePartialDateInput(rawDatePart)

  if (!normalized.includes('T')) {
    return dateText
  }

  if (!rawTimePart) {
    return `${dateText}T`
  }

  const timeText = rawTimePart.replace(/[^\d:]/g, '').replace(/:+/g, ':')

  if (!timeText.includes(':')) {
    return `${dateText}T${timeText.slice(0, 2)}`
  }

  if (timeText.endsWith(':')) {
    const [hourPart = '', minutePart = ''] = timeText.slice(0, -1).split(':')
    return `${dateText}T${hourPart.slice(0, 2)}:${minutePart.slice(0, 2)}:`.replace(/:$/, ':')
  }

  const [hourPart = '', minutePart = '', secondPart = ''] = timeText.split(':')
  const hour = hourPart.slice(0, 2)
  const minute = minutePart.slice(0, 2)
  const second = secondPart.slice(0, 2)

  if (secondPart !== '') {
    return `${dateText}T${hour}:${minute}:${second}`
  }

  return `${dateText}T${hour}:${minute}`
}

export const isPartialDateTimeValue = (value: string) => /^\d{1,4}(?:-\d{0,2}){0,2}(?:T\d{0,2}(?::\d{0,2})?:?)?$/.test(value)

export const sanitizeDateTextValue = (value: string) => sanitizePartialDateInput(value)

export const sanitizeDateTimeTextValue = (value: string) => sanitizePartialDateTimeInput(value)

export const clampInputYearLength = (value: string) => {
  if (!value) {
    return value
  }

  const [datePart, timePart] = value.split('T')
  const dateSegments = datePart.split('-')

  if (dateSegments.length === 0 || !dateSegments[0]) {
    return value
  }

  const yearText = normalizeDateSegment(dateSegments[0], 4)
  const normalizedDate = [yearText, ...dateSegments.slice(1).map((segment) => normalizeDateSegment(segment, segment.length > 2 ? 2 : segment.length))].join('-')

  return timePart !== undefined ? `${normalizedDate}T${timePart}` : normalizedDate
}

export const hasOverFourDigitYear = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return false
  }

  return /^\d{5,}-\d{2}-\d{2}$/.test(trimmed) || /^\d{5,}-\d{2}-\d{2}T/.test(trimmed)
}

export const getFourDigitYearError = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  if (hasOverFourDigitYear(trimmed)) {
    return '年は4桁で入力してください。'
  }

  return null
}

export const isValidDateValue = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value.trim())

export const isValidDateTimeValue = (value: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value.trim())
