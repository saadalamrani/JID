import { MENTOR_NATIONALITY_OPTIONS } from '@/lib/mentor-discovery/constants'

export function formatMentorNationality(
  code: string | null | undefined,
  locale: 'ar' | 'en' = 'ar',
): string | null {
  if (!code?.trim()) return null
  const option = MENTOR_NATIONALITY_OPTIONS.find((item) => item.value === code)
  if (!option) return code
  return locale === 'en' ? option.labelEn : option.labelAr
}
