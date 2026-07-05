const RELATIVE_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
  { unit: 'year', seconds: 60 * 60 * 24 * 365 },
  { unit: 'month', seconds: 60 * 60 * 24 * 30 },
  { unit: 'week', seconds: 60 * 60 * 24 * 7 },
  { unit: 'day', seconds: 60 * 60 * 24 },
  { unit: 'hour', seconds: 60 * 60 },
  { unit: 'minute', seconds: 60 },
]

const arabicRelativeFormatter = new Intl.RelativeTimeFormat('ar', {
  numeric: 'always',
  style: 'long',
})

/**
 * Arabic relative time — e.g. "قبل ساعتين", "قبل 3 أيام".
 */
export function formatRelativeTime(iso: string | Date | null | undefined): string {
  if (!iso) return 'غير متوفر'

  const date = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(date.getTime())) return 'غير متوفر'

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const absSeconds = Math.abs(diffSeconds)

  if (absSeconds < 45) return 'الآن'

  for (const { unit, seconds } of RELATIVE_UNITS) {
    if (absSeconds >= seconds || unit === 'minute') {
      const value = Math.round(diffSeconds / seconds)
      return arabicRelativeFormatter.format(value, unit)
    }
  }

  return 'الآن'
}
