import type { CareerItem } from '@/lib/career-operations/types'

export function careerItemTitle(item: CareerItem, locale: 'ar' | 'en'): string {
  if (locale === 'ar') return item.title_ar || item.title_en || item.organization_name || item.opportunity_id
  return item.title_en || item.title_ar || item.organization_name || item.opportunity_id
}

export function formatRiyadhDate(value: string | null, locale: 'ar' | 'en'): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-SA-u-nu-latn', {
    dateStyle: 'medium',
    timeZone: 'Asia/Riyadh',
  }).format(date)
}
