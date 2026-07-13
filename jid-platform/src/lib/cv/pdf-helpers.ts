/**
 * Section 6.1 — PDF formatting helpers.
 */

import { ADDITIONAL_CATEGORIES, type AdditionalCategory, type CvAdditionalData, type CvLanguageProficiency } from '@/types/cv'

export const SECTION_LABELS = {
  en: {
    education: 'Education',
    experience: 'Experience',
    skills: 'Skills',
    summary: 'Summary',
    present: 'Present',
    gpa: 'GPA',
    languages: 'Languages',
  },
  ar: {
    education: 'التعليم',
    experience: 'الخبرة',
    skills: 'المهارات',
    summary: 'نبذة',
    present: 'الحاضر',
    gpa: 'المعدل',
    languages: 'اللغات',
  },
} as const

export const LANGUAGE_PROFICIENCY_LABELS: Record<
  'ar' | 'en',
  Record<CvLanguageProficiency, string>
> = {
  en: {
    native: 'Native',
    fluent: 'Fluent',
    professional_working: 'Professional Working',
    conversational: 'Conversational',
    basic: 'Basic',
  },
  ar: {
    native: 'لغة أم',
    fluent: 'طليق',
    professional_working: 'مهني',
    conversational: 'محادثة',
    basic: 'أساسي',
  },
}

export const CATEGORY_LABELS: Record<'ar' | 'en', Record<AdditionalCategory, string>> = {
  en: {
    certification: 'Certifications',
    award: 'Awards',
    leadership: 'Leadership',
    volunteer: 'Volunteer Experience',
    project: 'Projects',
    publication: 'Publications',
    language: 'Languages',
    other: 'Additional',
  },
  ar: {
    certification: 'الشهادات',
    award: 'الجوائز',
    leadership: 'القيادة',
    volunteer: 'التطوع',
    project: 'المشاريع',
    publication: 'المنشورات',
    language: 'اللغات',
    other: 'إضافي',
  },
}

const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

const MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const

function formatMonthYear(
  month: number | null,
  year: number | null,
  locale: 'ar' | 'en',
): string {
  if (year == null) return ''
  if (month == null || month < 1 || month > 12) return String(year)
  const months = locale === 'ar' ? MONTHS_AR : MONTHS_EN
  return `${months[month - 1]} ${year}`
}

/** Section 6.1 — month/year range with en-dash separator. */
export function formatDateRange(
  startMonth: number | null,
  startYear: number | null,
  endMonth: number | null,
  endYear: number | null,
  isCurrent: boolean,
  locale: 'ar' | 'en' = 'en',
): string {
  const start = formatMonthYear(startMonth, startYear, locale)
  const end = isCurrent
    ? SECTION_LABELS[locale].present
    : formatMonthYear(endMonth, endYear, locale)

  if (!start && !end) return ''
  if (!start) return end
  if (!end) return start
  return `${start} – ${end}`
}

function formatIsoDateRange(
  startDate: string | null,
  endDate: string | null,
  locale: 'ar' | 'en',
): string {
  if (!startDate && !endDate) return ''

  const formatOne = (iso: string): string => {
    const parsed = new Date(iso)
    if (Number.isNaN(parsed.getTime())) return iso
    const month = parsed.getUTCMonth() + 1
    const year = parsed.getUTCFullYear()
    return formatMonthYear(month, year, locale)
  }

  const start = startDate ? formatOne(startDate) : ''
  const end = endDate ? formatOne(endDate) : ''
  if (!start && !end) return ''
  if (!start) return end
  if (!end) return start
  return `${start} – ${end}`
}

/** Human-readable anchor text for hyperlinks (never raw URL in body). */
export function getAnchorText(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase()

    if (host.includes('linkedin.com')) return 'LinkedIn'
    if (host.includes('github.com')) return 'GitHub'
    if (host.includes('twitter.com') || host === 'x.com') return 'X'
    if (host.includes('behance.net')) return 'Behance'
    if (host.includes('dribbble.com')) return 'Dribbble'
    return 'Website'
  } catch {
    return 'Link'
  }
}

/** Group additional items by category in canonical order; omit empty groups. */
export function groupAdditional(
  items: CvAdditionalData[],
): Array<{ category: AdditionalCategory; items: CvAdditionalData[] }> {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order)
  const byCategory = new Map<AdditionalCategory, CvAdditionalData[]>()

  for (const item of sorted) {
    const bucket = byCategory.get(item.category) ?? []
    bucket.push(item)
    byCategory.set(item.category, bucket)
  }

  return ADDITIONAL_CATEGORIES.filter((category) => (byCategory.get(category)?.length ?? 0) > 0).map(
    (category) => ({
      category,
      items: byCategory.get(category)!,
    }),
  )
}

/** Single-line additional entry label (title — issuer — dates). */
export function formatAdditionalItem(item: CvAdditionalData, locale: 'ar' | 'en'): string {
  const segments: string[] = [item.title.trim()]

  if (item.issuer?.trim()) {
    segments.push(item.issuer.trim())
  }

  const dates = formatIsoDateRange(item.start_date, item.end_date, locale)
  if (dates) {
    segments.push(dates)
  }

  return segments.join(' — ')
}

export function formatDegreeLine(
  degree: string | null,
  fieldOfStudy: string | null,
): string | null {
  const parts = [degree?.trim(), fieldOfStudy?.trim()].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

export function formatGpaLine(
  gpaValue: number | null,
  gpaScale: number | null,
  locale: 'ar' | 'en',
): string | null {
  if (gpaValue == null) return null
  const label = SECTION_LABELS[locale].gpa
  const scale = gpaScale != null ? `/${gpaScale}` : ''
  return `${label}: ${gpaValue}${scale}`
}

export function formatGraduationYearLine(
  graduationYear: number | null,
  locale: 'ar' | 'en',
): string | null {
  if (graduationYear == null) return null
  return locale === 'ar'
    ? `سنة التخرج: ${graduationYear}`
    : `Class of ${graduationYear}`
}

export function sortByOrder<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order)
}

export type ContactSegment =
  | { kind: 'text'; value: string }
  | { kind: 'link'; href: string; label: string }

export function buildContactSegments(input: {
  city: string | null
  country: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  github_url?: string | null
  portfolio_url?: string | null
  custom_link_1_label?: string | null
  custom_link_1_url?: string | null
  custom_link_2_label?: string | null
  custom_link_2_url?: string | null
}): ContactSegment[] {
  const segments: ContactSegment[] = []
  const location = [input.city?.trim(), input.country?.trim()].filter(Boolean).join(', ')

  if (location) segments.push({ kind: 'text', value: location })
  if (input.email?.trim()) {
    segments.push({ kind: 'link', href: `mailto:${input.email.trim()}`, label: input.email.trim() })
  }
  if (input.phone?.trim()) {
    segments.push({ kind: 'link', href: `tel:${input.phone.trim()}`, label: input.phone.trim() })
  }

  const linkFields: Array<{ url: string | null | undefined; label?: string | null }> = [
    { url: input.linkedin_url },
    { url: input.github_url },
    { url: input.portfolio_url, label: 'Portfolio' },
    { url: input.custom_link_1_url, label: input.custom_link_1_label },
    { url: input.custom_link_2_url, label: input.custom_link_2_label },
  ]

  for (const field of linkFields) {
    const href = field.url?.trim()
    if (!href) continue
    segments.push({
      kind: 'link',
      href,
      label: field.label?.trim() || getAnchorText(href),
    })
  }

  return segments
}
