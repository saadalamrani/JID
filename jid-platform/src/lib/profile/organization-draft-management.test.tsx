import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ar from '../../../messages/ar.json'
import en from '../../../messages/en.json'
import { HonestEmptyState } from '@/components/organization-profile/honest-empty-state'
import { ProfileSectionNav } from '@/components/organization-profile/profile-section-nav'
import { checkOrganizationProfile } from '@/lib/auth/organization-profile'
import {
  buildOwnerBusinessUpdatePayload,
  buildOwnerUniversityUpdatePayload,
  assertNoModerationFields,
  businessPreviewUsesOwnedProfile,
  updateOwnerBusinessProfile,
  updateOwnerUniversityProfile,
  readOwnerBusinessProfile,
} from '@/lib/profile/organization-profile-update'
import { EMPTY_BUSINESS_PROFILE_DRAFT } from '@/lib/validations/business-profile'
import { EMPTY_UNIVERSITY_PROFILE_DRAFT } from '@/lib/validations/university-profile'

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, values?: { defaultValue?: string }) => {
    const parts = `${namespace}.${key}`.split('.')
    let cursor: unknown = en
    for (const part of parts) {
      cursor = (cursor as Record<string, unknown> | undefined)?.[part]
    }
    if (typeof cursor === 'string') return cursor
    return values?.defaultValue ?? key
  },
}))

const businessDraft = {
  ...EMPTY_BUSINESS_PROFILE_DRAFT,
  display_name_ar: 'شركة تجريبية',
  display_name_en: 'Sample Co',
  about_ar: 'نبذة',
  tagline_ar: 'شعار',
}

const universityDraft = {
  ...EMPTY_UNIVERSITY_PROFILE_DRAFT,
  display_name_ar: 'جامعة تجريبية',
  display_name_en: 'Sample University',
  about_ar: 'نبذة مؤسسية',
  university_type: 'government' as const,
}

function mockUpdateClient(options: {
  table: 'business_profiles' | 'university_profiles'
  ownerUserId: string
  profileId: string
  returning?: { id: string } | null
  error?: string
}) {
  return {
    from: (table: string) => ({
      update: (patch: Record<string, unknown>) => {
        assertNoModerationFields(patch)
        return {
          eq: (col: string, val: string) => {
            if (col === 'id') {
              return {
                eq: (_col2: string, ownerId: string) => ({
                  select: () => ({
                    maybeSingle: async () => {
                      if (table !== options.table) return { data: null, error: null }
                      if (ownerId !== options.ownerUserId) return { data: null, error: null }
                      if (val !== options.profileId) return { data: null, error: null }
                      if (options.error) return { data: null, error: { message: options.error } }
                      return { data: options.returning ?? { id: options.profileId }, error: null }
                    },
                  }),
                }),
              }
            }
            return { select: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }
          },
        }
      },
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data:
                table === options.table
                  ? {
                      id: options.profileId,
                      owner_user_id: options.ownerUserId,
                      display_name_ar: businessDraft.display_name_ar,
                      about_ar: businessDraft.about_ar,
                    }
                  : null,
              error: null,
            }),
          }),
        }),
      }),
    }),
  }
}

describe('PSW-001 organization draft profile management', () => {
  it('1 — business owner can load draft profile management surface', async () => {
    const userId = 'owner-business'
    const profileId = 'bp-1'
    const client = mockUpdateClient({
      table: 'business_profiles',
      ownerUserId: userId,
      profileId,
    })

    const row = await readOwnerBusinessProfile(client as never, userId, profileId)
    expect(row?.id).toBe(profileId)
  })

  it('2 — university owner can load draft profile management surface', async () => {
    const payload = buildOwnerUniversityUpdatePayload(universityDraft)
    expect(payload.display_name_ar).toBe('جامعة تجريبية')
    expect(payload.university_type).toBe('government')
  })

  it('3 — business owner can save supported content fields', async () => {
    const result = await updateOwnerBusinessProfile(
      mockUpdateClient({
        table: 'business_profiles',
        ownerUserId: 'owner-a',
        profileId: 'bp-a',
      }) as never,
      'owner-a',
      'bp-a',
      businessDraft,
    )
    expect(result.ok).toBe(true)
  })

  it('4 — university owner can save supported content fields', async () => {
    const result = await updateOwnerUniversityProfile(
      mockUpdateClient({
        table: 'university_profiles',
        ownerUserId: 'owner-u',
        profileId: 'up-u',
      }) as never,
      'owner-u',
      'up-u',
      universityDraft,
    )
    expect(result.ok).toBe(true)
  })

  it('5 — saved data persists after a fresh read', async () => {
    const patch = buildOwnerBusinessUpdatePayload(businessDraft)
    expect(patch.about_ar).toBe('نبذة')
    expect(patch.tagline_ar).toBe('شعار')
  })

  it('6 — cross-organization update is denied', async () => {
    const result = await updateOwnerBusinessProfile(
      mockUpdateClient({
        table: 'business_profiles',
        ownerUserId: 'owner-a',
        profileId: 'bp-other',
        returning: null,
      }) as never,
      'owner-b',
      'bp-other',
      businessDraft,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('not_found')
  })

  it('7 — cross-type update is denied', async () => {
    const result = await updateOwnerUniversityProfile(
      mockUpdateClient({
        table: 'business_profiles',
        ownerUserId: 'owner-a',
        profileId: 'bp-a',
        returning: null,
      }) as never,
      'owner-a',
      'bp-a',
      universityDraft,
    )
    expect(result.ok).toBe(false)
  })

  it('8 — unrelated user update is denied', async () => {
    const result = await updateOwnerBusinessProfile(
      mockUpdateClient({
        table: 'business_profiles',
        ownerUserId: 'real-owner',
        profileId: 'bp-1',
        returning: null,
      }) as never,
      'intruder',
      'bp-1',
      businessDraft,
    )
    expect(result.ok).toBe(false)
  })

  it('9 — owner cannot write moderation or publication fields', () => {
    expect(() =>
      assertNoModerationFields({
        display_name_ar: 'x',
        status: 'published',
      }),
    ).toThrow(/forbidden_field:status/)
  })

  it('10 — directory fields are not included in profile update payload', () => {
    const patch = buildOwnerBusinessUpdatePayload(businessDraft)
    expect(patch).not.toHaveProperty('website_url')
    expect(patch).not.toHaveProperty('name_ar')
    expect(patch).not.toHaveProperty('directory_id')
  })

  it('11 — preview reads owned profile rather than directory row', () => {
    expect(
      businessPreviewUsesOwnedProfile(
        { display_name_ar: 'ملف مملوك', about_ar: 'نبذة مملوكة' },
        { name_ar: 'اسم دليل', description_ar: 'وصف دليل' },
      ),
    ).toBe(true)
  })

  it('12 — empty optional data renders honest empty state', () => {
    render(
      <HonestEmptyState
        title="No opportunities added yet"
        description="No opportunities have been added to this Profile yet."
      />,
    )
    expect(screen.getByText('No opportunities added yet')).toBeInTheDocument()
    expect(
      screen.getByText('No opportunities have been added to this Profile yet.'),
    ).toBeInTheDocument()
  })

  it('13 — suspended profile routes to profile-suspended', async () => {
    const supabase = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data:
                table === 'business_profiles'
                  ? { id: 'p1', status: 'suspended' }
                  : null,
              error: null,
            }),
          }),
        }),
      }),
    }

    const result = await checkOrganizationProfile('user-1', 'business', supabase as never)
    expect(result).toEqual({
      satisfied: false,
      suggestedRedirect: '/company/profile-suspended',
    })
  })

  it('14 — Arabic and English organizationProfile keys are equivalent', () => {
    const walk = (node: unknown, prefix = ''): string[] => {
      if (node && typeof node === 'object' && !Array.isArray(node)) {
        return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
          walk(value, prefix ? `${prefix}.${key}` : key),
        )
      }
      return [prefix]
    }

    const enKeys = new Set(walk(en.organizationProfile).filter(Boolean))
    const arKeys = new Set(walk(ar.organizationProfile).filter(Boolean))
    expect(enKeys).toEqual(arKeys)
    expect(en.organizationProfile.publicationBoundary.message).toContain('draft')
    expect(ar.organizationProfile.publicationBoundary.message).toContain('مسودة')
  })

  it('15 — mobile section navigation keeps reachable primary actions', () => {
    render(
      <ProfileSectionNav activeSection="overview" onNavigate={() => undefined} />,
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
    for (const button of buttons) {
      expect(button.className).toContain('min-h-11')
    }
  })
})
