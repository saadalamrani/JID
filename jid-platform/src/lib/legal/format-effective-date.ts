import type { Locale } from '@/lib/i18n/config'

/** Format LEGAL_EFFECTIVE_DATE for display in legal document headers. */
export function formatLegalEffectiveDate(isoDate: string, locale: Locale): string {
  const date = new Date(`${isoDate}T12:00:00`)
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
