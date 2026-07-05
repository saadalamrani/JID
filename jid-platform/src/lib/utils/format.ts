import { TIMEZONE } from './constants'

const LATIN_DIGITS: Intl.NumberFormatOptions = {
  numberingSystem: 'latn',
}

type FormatDateOptions = Intl.DateTimeFormatOptions

function baseDateOptions(locale: string, options?: FormatDateOptions): Intl.DateTimeFormatOptions {
  return {
    timeZone: TIMEZONE,
    ...LATIN_DIGITS,
    ...options,
  }
}

export function formatDate(
  date: Date | string | number,
  locale: string,
  options?: FormatDateOptions,
): string {
  const value = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat(locale, baseDateOptions(locale, options)).format(value)
}

export function formatDateTime(
  date: Date | string | number,
  locale: string,
  options?: FormatDateOptions,
): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

export function formatTime(
  date: Date | string | number,
  locale: string,
  options?: FormatDateOptions,
): string {
  return formatDate(date, locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

export function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, { ...LATIN_DIGITS, ...options }).format(value)
}

export function formatCurrency(
  value: number,
  locale: string,
  currency = 'SAR',
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...LATIN_DIGITS,
    ...options,
  }).format(value)
}

export function formatRelativeTime(
  date: Date | string | number,
  locale: string,
  baseDate: Date = new Date(),
): string {
  const value = date instanceof Date ? date : new Date(date)
  const diffMs = value.getTime() - baseDate.getTime()
  const diffMinutes = Math.round(diffMs / 60_000)
  const diffHours = Math.round(diffMs / 3_600_000)
  const diffDays = Math.round(diffMs / 86_400_000)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always' })

  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute')
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')
  return rtf.format(diffDays, 'day')
}
