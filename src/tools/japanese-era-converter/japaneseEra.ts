import { getFourDigitYearError } from '../../utils/dateInputValidation.ts'

export type EraName = '明治' | '大正' | '昭和' | '平成' | '令和'

export type EraDefinition = {
  name: EraName
  startYear: number
  startMonth: number
  startDay: number
}

export const ERA_DEFINITIONS: EraDefinition[] = [
  { name: '明治', startYear: 1868, startMonth: 1, startDay: 25 },
  { name: '大正', startYear: 1912, startMonth: 7, startDay: 30 },
  { name: '昭和', startYear: 1926, startMonth: 12, startDay: 25 },
  { name: '平成', startYear: 1989, startMonth: 1, startDay: 8 },
  { name: '令和', startYear: 2019, startMonth: 5, startDay: 1 },
]

const toUtcDate = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

const getEraIndex = (date: Date) => {
  const dateTime = date.getTime()

  for (let index = 0; index < ERA_DEFINITIONS.length; index += 1) {
    const current = ERA_DEFINITIONS[index]
    const currentStart = toUtcDate(current.startYear, current.startMonth, current.startDay)

    if (!currentStart) {
      continue
    }

    const nextEra = ERA_DEFINITIONS[index + 1]
    const nextStart = nextEra
      ? toUtcDate(nextEra.startYear, nextEra.startMonth, nextEra.startDay)
      : null

    if (dateTime >= currentStart.getTime() && (!nextStart || dateTime < nextStart.getTime())) {
      return index
    }
  }

  return -1
}

export const formatGregorianDate = (date: Date) => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}年${Number(month)}月${Number(day)}日`
}

export const formatIsoDate = (date: Date) => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export type GregorianToJapaneseEraResult =
  | { error: string }
  | {
      eraName: EraName
      eraYear: number
      formatted: string
      iso: string
    }

export type JapaneseEraToGregorianResult =
  | { error: string }
  | {
      gregorianDate: Date
      formatted: string
      iso: string
    }

export const gregorianToJapaneseEra = (dateString: string): GregorianToJapaneseEraResult => {
  if (!dateString) {
    return { error: '西暦の日付を入力してください。' }
  }

  const fourDigitYearError = getFourDigitYearError(dateString)
  if (fourDigitYearError) {
    return { error: fourDigitYearError }
  }

  const [year, month, day] = dateString.split('-').map(Number)

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return { error: '有効な日付を入力してください。' }
  }

  const date = toUtcDate(year, month, day)
  if (!date) {
    return { error: '存在しない日付です。' }
  }

  const meijiStart = toUtcDate(1868, 1, 25)
  if (!meijiStart || date < meijiStart) {
    return { error: '対応している和暦の範囲外です。' }
  }

  const eraIndex = getEraIndex(date)
  if (eraIndex === -1) {
    return { error: '対応している和暦の範囲外です。' }
  }

  const era = ERA_DEFINITIONS[eraIndex]
  const eraYear = date.getUTCFullYear() - era.startYear + 1
  const displayYear = eraYear === 1 ? '元' : String(eraYear)

  return {
    eraName: era.name,
    eraYear,
    formatted: `${era.name}${displayYear}年${month}月${day}日`,
    iso: formatIsoDate(date),
  }
}

export const japaneseEraToGregorian = (args: {
  era: EraName
  year: string
  month: string
  day: string
}): JapaneseEraToGregorianResult => {
  const eraDefinition = ERA_DEFINITIONS.find((era) => era.name === args.era)

  if (!eraDefinition) {
    return { error: '元号を選択してください。' }
  }

  const yearValue = Number(args.year)
  const monthValue = Number(args.month)
  const dayValue = Number(args.day)

  if (!args.year.trim() || !Number.isInteger(yearValue) || yearValue <= 0) {
    return { error: '年は1以上の整数で入力してください。' }
  }

  if (!args.month.trim() || !Number.isInteger(monthValue) || monthValue < 1 || monthValue > 12) {
    return { error: '月は1〜12の整数で入力してください。' }
  }

  if (!args.day.trim() || !Number.isInteger(dayValue) || dayValue < 1 || dayValue > 31) {
    return { error: '日付は1〜31の整数で入力してください。' }
  }

  const gregorianYear = eraDefinition.startYear + yearValue - 1
  const gregorianDate = toUtcDate(gregorianYear, monthValue, dayValue)

  if (!gregorianDate) {
    return { error: '存在しない日付です。' }
  }

  const eraStart = toUtcDate(eraDefinition.startYear, eraDefinition.startMonth, eraDefinition.startDay)
  if (!eraStart) {
    return { error: '元号の開始日を計算できませんでした。' }
  }

  const nextEra = ERA_DEFINITIONS[ERA_DEFINITIONS.findIndex((era) => era.name === eraDefinition.name) + 1]
  const nextEraStart = nextEra
    ? toUtcDate(nextEra.startYear, nextEra.startMonth, nextEra.startDay)
    : null

  if (gregorianDate < eraStart || (nextEraStart && gregorianDate >= nextEraStart)) {
    const eraLabel = yearValue === 1 ? '元' : String(yearValue)
    return {
      error: `${eraDefinition.name}${eraLabel}年${monthValue}月${dayValue}日は${eraDefinition.name}の範囲外です。`,
    }
  }

  return {
    gregorianDate,
    formatted: `${gregorianYear}年${monthValue}月${dayValue}日`,
    iso: formatIsoDate(gregorianDate),
  }
}
