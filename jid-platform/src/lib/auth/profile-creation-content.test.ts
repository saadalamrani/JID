import { describe, expect, it } from 'vitest'
import {
  buildBusinessProfileContentPatch,
  buildUniversityProfileContentPatch,
  FORBIDDEN_PROFILE_MODERATION_KEYS,
} from '@/lib/auth/profile-creation-content'
import { EMPTY_BUSINESS_PROFILE_DRAFT } from '@/lib/validations/business-profile'
import { EMPTY_UNIVERSITY_PROFILE_DRAFT } from '@/lib/validations/university-profile'

describe('profile creation content patches (JID-102B)', () => {
  it('3 — business content patch does not include status or published_at', () => {
    const patch = buildBusinessProfileContentPatch({
      ...EMPTY_BUSINESS_PROFILE_DRAFT,
      display_name_ar: 'شركة',
      tagline_ar: 'شعار',
      about_ar: 'نبذة',
    })

    for (const key of FORBIDDEN_PROFILE_MODERATION_KEYS) {
      expect(Object.keys(patch)).not.toContain(key)
    }
    expect(patch).not.toHaveProperty('status')
    expect(patch).not.toHaveProperty('published_at')
  })

  it('university content patch does not include status or published_at', () => {
    const patch = buildUniversityProfileContentPatch({
      ...EMPTY_UNIVERSITY_PROFILE_DRAFT,
      display_name_ar: 'جامعة',
      about_ar: 'نبذة',
    })

    for (const key of FORBIDDEN_PROFILE_MODERATION_KEYS) {
      expect(Object.keys(patch)).not.toContain(key)
    }
  })
})
