import type { BusinessProfileDraft } from '@/lib/validations/business-profile'
import type { UniversityProfileDraft } from '@/lib/validations/university-profile'

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** Owner-writable content fields only — never status, published_at, or moderation fields. */
export function buildBusinessProfileContentPatch(draft: BusinessProfileDraft) {
  return {
    tagline_ar: emptyToNull(draft.tagline_ar ?? ''),
    about_ar: emptyToNull(draft.about_ar ?? ''),
    about_en: emptyToNull(draft.about_en ?? ''),
    founded_year: draft.founded_year ?? null,
    employee_count_range: draft.employee_count_range ?? null,
    cover_image_url: emptyToNull(draft.cover_image_url ?? ''),
  }
}

/** Owner-writable university content fields only — never status or published_at. */
export function buildUniversityProfileContentPatch(draft: UniversityProfileDraft) {
  return {
    about_ar: emptyToNull(draft.about_ar ?? ''),
    about_en: emptyToNull(draft.about_en ?? ''),
  }
}

export const FORBIDDEN_PROFILE_MODERATION_KEYS = ['status', 'published_at', 'verified_badge'] as const
