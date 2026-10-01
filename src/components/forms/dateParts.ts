export type DatePartsValue = {
  year: string
  month: string
  day: string
}

export const clampPart = (value: string, maxLength: number) => value.replace(/\D/g, '').slice(0, maxLength)

export const normalizeDatePart = (value: string, digits: number) => {
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

