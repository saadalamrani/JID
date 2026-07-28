/**
 * Spec 04-B — Business end-to-end journey integration suite (§20)
 * plus focused regressions for Session A DEF-01…DEF-08.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveBusinessCreateProfileGate } from '@/lib/entity/business-create-profile-gate'
import {
  orgOutcomeRoutes,
  resolveVerificationOutcome,
} from '@/lib/entity/verification-outcome'
import {
  businessPreviewUsesOwnedProfile,
  readOwnerBusinessProfile,
  updateOwnerBusinessProfile,
} from '@/lib/profile/organization-profile-update'
import { EMPTY_BUSINESS_PROFILE_DRAFT } from '@/lib/validations/business-profile'

const root = join(__dirname, '../../..')

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), 'utf8')
}

describe('Spec 04 §20 — approved → wizard gate', () => {
  it('approved with no Profile stays on create-profile wizard', () => {
    const gate = resolveBusinessCreateProfileGate({
      profile: null,
      verification: { status: 'approved', resulting_profile_id: null },
    })
    expect(gate.action).toBe('stay')
    expect(gate.outcome.kind).toBe('create_profile')
    expect(gate.outcome.path).toBe(orgOutcomeRoutes('business').createProfile)
  })

  it('rejected redirects to rejected (DEF-05)', () => {
    const gate = resolveBusinessCreateProfileGate({
      profile: null,
      verification: { status: 'rejected', resulting_profile_id: null },
    })
    expect(gate.action).toBe('redirect')
    if (gate.action === 'redirect') {
      expect(gate.path).toBe(orgOutcomeRoutes('business').rejected)
    }
  })

  it('no verification redirects to signup (DEF-05)', () => {
    const gate = resolveBusinessCreateProfileGate({
      profile: null,
      verification: null,
    })
    expect(gate.action).toBe('redirect')
    if (gate.action === 'redirect') {
      expect(gate.path).toBe(orgOutcomeRoutes('business').signup)
    }
  })
})

describe('Spec 04 §20 — wizard re-entry with existing Profile redirects (DEF-03)', () => {
  it('existing draft Profile redirects to dashboard (never stays on wizard)', () => {
    const gate = resolveBusinessCreateProfileGate({
      profile: { status: 'draft' },
      verification: { status: 'approved', resulting_profile_id: 'orphan-or-real' },
    })
    expect(gate.action).toBe('redirect')
    if (gate.action === 'redirect') {
      expect(gate.path).toBe(orgOutcomeRoutes('business').dashboard)
    }
  })

  it('orphaned resulting_profile_id without Profile stays on wizard (DEF-04 — no loop)', () => {
    const gate = resolveBusinessCreateProfileGate({
      profile: null,
      verification: { status: 'approved', resulting_profile_id: 'orphaned-id' },
    })
    expect(gate.action).toBe('stay')
    expect(gate.outcome.kind).toBe('create_profile')

    const outcome = resolveVerificationOutcome({
      orgType: 'business',
      authenticated: true,
      profile: null,
      verification: { status: 'approved', resulting_profile_id: 'orphaned-id' },
    })
    expect(outcome.kind).toBe('create_profile')
    expect(outcome.path).not.toBe(orgOutcomeRoutes('business').dashboard)
  })
})

describe('Spec 04 §20 — suspended precedence (DEF-08)', () => {
  it('suspended Profile overrides pending verification destination', () => {
    const outcome = resolveVerificationOutcome({
      orgType: 'business',
      authenticated: true,
      profile: { status: 'suspended' },
      verification: { status: 'pending_review', resulting_profile_id: null },
    })
    expect(outcome.kind).toBe('suspended')
    expect(outcome.path).toBe(orgOutcomeRoutes('business').suspended)
  })

  it('create-profile gate sends suspended owners to suspended page', () => {
    const gate = resolveBusinessCreateProfileGate({
      profile: { status: 'suspended' },
      verification: { status: 'approved', resulting_profile_id: 'p1' },
    })
    expect(gate.action).toBe('redirect')
    if (gate.action === 'redirect') {
      expect(gate.path).toBe(orgOutcomeRoutes('business').suspended)
    }
  })
})

describe('Spec 04 §20 — edit → save → reload persistence (PSW-001 regression)', () => {
  it('owner-scoped update + reload round-trip; non-owner denied', async () => {
    const ownerId = 'owner-1'
    const otherId = 'other-2'
    const profileId = 'bp-1'
    let stored: Record<string, unknown> = {
      id: profileId,
      owner_user_id: ownerId,
      display_name_ar: 'قبل',
      about_ar: 'نبذة قديمة',
    }

    const client = {
      from: (table: string) => {
        expect(table).toBe('business_profiles')
        return {
          update: (patch: Record<string, unknown>) => ({
            eq: (col: string, val: string) => {
              expect(col).toBe('id')
              expect(val).toBe(profileId)
              return {
                eq: (col2: string, owner: string) => ({
                  select: () => ({
                    maybeSingle: async () => {
                      expect(col2).toBe('owner_user_id')
                      if (owner !== ownerId) {
                        return { data: null, error: null }
                      }
                      stored = { ...stored, ...patch }
                      return { data: { id: profileId }, error: null }
                    },
                  }),
                }),
              }
            },
          }),
          select: () => ({
            eq: (col: string, val: string) => ({
              eq: (col2: string, owner: string) => ({
                maybeSingle: async () => {
                  if (col !== 'id' || val !== profileId) return { data: null, error: null }
                  if (col2 !== 'owner_user_id' || owner !== ownerId) {
                    return { data: null, error: null }
                  }
                  return { data: stored, error: null }
                },
              }),
            }),
          }),
        }
      },
    }

    const draft = {
      ...EMPTY_BUSINESS_PROFILE_DRAFT,
      display_name_ar: 'بعد الحفظ',
      about_ar: 'نبذة بعد الحفظ',
    }

    const denied = await updateOwnerBusinessProfile(
      client as never,
      otherId,
      profileId,
      draft,
    )
    expect(denied).toEqual({ ok: false, reason: 'not_found' })

    const saved = await updateOwnerBusinessProfile(client as never, ownerId, profileId, draft)
    expect(saved).toEqual({ ok: true })

    const reloaded = await readOwnerBusinessProfile(client as never, ownerId, profileId)
    expect(reloaded?.display_name_ar).toBe('بعد الحفظ')
    expect(reloaded?.about_ar).toBe('نبذة بعد الحفظ')
  })
})

describe('Spec 04 §20 — visitor draft invisibility', () => {
  it('public published fetch filters status=published (source)', () => {
    const src = readSrc('src/lib/queries/business-profile-public.ts')
    expect(src).toMatch(/\.eq\('status',\s*'published'\)/)
    expect(src).toMatch(/fetchPublishedBusinessProfileBySlug/)
  })

  it('owner preview uses owned Profile fields, not Directory names', () => {
    expect(
      businessPreviewUsesOwnedProfile(
        { display_name_ar: 'ملف مملوك', about_ar: 'وصف الملف' },
        { name_ar: 'سجل الدليل', description_ar: 'وصف الدليل' },
      ),
    ).toBe(true)
  })
})

describe('Spec 04 §20 — legacy redirects land correctly', () => {
  it('company legacy stubs redirect to Spec 03 surfaces', () => {
    expect(readSrc('src/app/[locale]/(company)/company/claim/reapply/page.tsx')).toMatch(
      /redirect\('\/company\/verification\/reapply'\)/,
    )
    expect(readSrc('src/app/[locale]/(company)/company/pending-review/page.tsx')).toMatch(
      /redirect\('\/company\/verification-pending'\)/,
    )
    expect(readSrc('src/app/[locale]/(company)/company/rejected/page.tsx')).toMatch(
      /redirect\('\/company\/verification-rejected'\)/,
    )
  })
})

describe('Spec 04-B per-defect regressions', () => {
  it('DEF-01: /company/profile loads owned business_profiles via fetchOwnerBusinessProfile', () => {
    const page = readSrc('src/app/[locale]/(company)/company/profile/page.tsx')
    expect(page).toMatch(/fetchOwnerBusinessProfile/)
    expect(page).toMatch(/BusinessProfileView/)
    expect(page).not.toMatch(/fetchOwnCompanyPageContext/)
    expect(page).not.toMatch(/getCurrentViewer/)
    expect(page).not.toMatch(/CompanyProfileView/)
  })

  it('DEF-02: company layout no longer uses companies.claimed_by', () => {
    const layout = readSrc('src/app/[locale]/(company)/layout.tsx')
    expect(layout).toMatch(/fetchOwnerBusinessProfile/)
    expect(layout).toMatch(/university_profiles/)
    expect(layout).not.toMatch(/\.eq\(\s*['"]claimed_by['"]/)
    expect(layout).not.toMatch(/from\(['"]companies['"]\)/)
  })

  it('DEF-03/04/05: create-profile uses gate helper + latest verification', () => {
    const page = readSrc('src/app/[locale]/(company)/company/create-profile/page.tsx')
    expect(page).toMatch(/resolveBusinessCreateProfileGate/)
    expect(page).toMatch(/fetchOwnerBusinessProfileRow/)
    expect(page).toMatch(/getLatestVerificationForUser/)
    expect(page).not.toMatch(/resulting_profile_id\)\s*\{\s*redirect\('\/company\/dashboard'\)/)
    expect(page).not.toMatch(/redirect\('\/company\/verification-pending'\)/)
  })

  it('DEF-06: middleware wrong-role redirects to /login (entity portal path)', () => {
    const mw = readSrc('src/middleware.ts')
    expect(mw).toMatch(/Spec 04-B DEF-06/)
    expect(mw).toMatch(/redirectTo\(request, '\/login'/)
    // Staff / Super Admin portals retain notFound obscurity.
    expect(mw).toMatch(/handleStaffPortal[\s\S]*notFoundResponse\(\)/)
  })

  it('DEF-07: billing resolves via fetchOwnerBusinessProfile.directory_id', () => {
    const page = readSrc('src/app/[locale]/(company)/billing/page.tsx')
    expect(page).toMatch(/fetchOwnerBusinessProfile/)
    expect(page).toMatch(/directory_id/)
    expect(page).not.toMatch(/\.eq\(\s*['"]claimed_by['"]/)
    expect(page).not.toMatch(/from\(['"]companies['"]\)/)
  })

  it('DEF-08: verification-pending loads profile row into resolveVerificationOutcome', () => {
    const page = readSrc(
      'src/app/[locale]/(company)/company/verification-pending/page.tsx',
    )
    expect(page).toMatch(/fetchOwnerBusinessProfileRow/)
    expect(page).toMatch(/profile: profileRow \? \{ status: profileRow\.status \} : null/)
    expect(page).not.toMatch(/profile:\s*null,\s*\n\s*verification:/)
  })
})

describe('Spec 04-B — non-owner denial on owner routes (structural)', () => {
  it('edit page requires fetchOwnerBusinessProfile before rendering management', () => {
    const edit = readSrc('src/app/[locale]/(company)/company/profile/edit/page.tsx')
    expect(edit).toMatch(/fetchOwnerBusinessProfile/)
    expect(edit).toMatch(/redirect\('\/company\/create-profile'\)/)
  })

  it('owner update path always scopes owner_user_id', () => {
    const update = readSrc('src/lib/profile/organization-profile-update.ts')
    expect(update).toMatch(/\.eq\('owner_user_id',\s*userId\)/)
  })
})
