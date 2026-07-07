/** Section 6.6 / 6.7 — Arabic number and time formatting for Platform Pulse. */

const AR_LOCALE = 'ar-SA'

/** Honest freshness timestamp for the stats hub header ("آخر تحديث"). */
export function formatTimeAr(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(AR_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/** Integer metrics — Arabic digit grouping via ar-SA. */
export function formatArabicNumber(value: number): string {
  return Math.round(value).toLocaleString(AR_LOCALE)
}

/** Percentage metrics — one decimal place with Arabic digits. */
export function formatArabicPercentage(value: number): string {
  const formatted = value.toLocaleString(AR_LOCALE, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return `${formatted}%`
}
