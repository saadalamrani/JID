/**
 * Spec 05-B — University end-to-end journey integration suite (§20)
 * plus focused regressions for Session A DEF-01…DEF-07.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { resolveUniversityCreateProfileGate } from '@/lib/entity/university-create-profile-gate'
import {
  orgOutcomeRoutes,
  resolveVerificationOutcome,
} from '@/lib/entity/verification-outcome'
import {
  fetchOwnerUniversityProfile,
  fetchOwnerUniversityProfileRow,
} from '@/lib/profile/owner-university-profile'
import {
  readOwnerUniversityProfile,
  updateOwnerUniversityProfile,
} from '@/lib/profile/organization-profile-update'
import { EMPTY_UNIVERSITY_PROFILE_DRAFT } from '@/lib/validations/university-profile'

const root = join(__dirname, '../../..')

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), 'utf8')
}

function collectFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) collectFiles(full, acc)
    else if (/\.(ts|tsx)$/.test(name)) acc.push(full)
  }
  return acc
}

describe('Spec 05 §20 — approved → wizard gate (DEF-02)', () => {
  it('approved with no Profile stays on create-profile wizard', () => {
    const gate = resolveUniversityCreateProfileGate({
      profile: null,
      verification: { status: 'approved', resulting_profile_id: null },
    })
    expect(gate.action).toBe('stay')
    expect(gate.outcome.kind).toBe('create_profile')
    expect(gate.outcome.path).toBe(orgOutcomeRoutes('university').createProfile)
  })

  it('rejected redirects to rejected', () => {
    const gate = resolveUniversityCreateProfileGate({
      profile: null,
      verification: { status: 'rejected', resulting_profile_id: null },
    })
    expect(gate.action).toBe('redirect')
    if (gate.action === 'redirect') {
      expect(gate.path).toBe(orgOutcomeRoutes('university').rejected)
    }
  })

  it('no verification redirects to signup', () => {
    const gate = resolveUniversityCreateProfileGate({
      profile: null,
      verification: null,
    })
    expect(gate.action).toBe('redirect')
    if (gate.action === 'redirect') {
      expect(gate.path).toBe(orgOutcomeRoutes('university').signup)
    }
  })
})

describe('Spec 05 §20 — wizard re-entry with existing Profile (DEF-01)', () => {
  it('existing draft Profile redirects to dashboard (never stays on wizard)', () => {
    const gate = resolveUniversityCreateProfileGate({
      profile: { status: 'draft' },
      verification: { status: 'approved', resulting_profile_id: 'orphan-or-real' },
    })
    expect(gate.action).toBe('redirect')
    if (gate.action === 'redirect') {
      expect(gate.path).toBe(orgOutcomeRoutes('university').dashboard)
    }
  })

  it('orphaned resulting_profile_id without Profile stays on wizard (no dashboard loop)', () => {
    const gate = resolveUniversityCreateProfileGate({
      profile: null,
      verification: { status: 'approved', resulting_profile_id: 'orphaned-id' },
    })
    expect(gate.action).toBe('stay')
    expect(gate.outcome.kind).toBe('create_profile')

    const outcome = resolveVerificationOutcome({
      orgType: 'university',
      authenticated: true,
      profile: null,
      verification: { status: 'approved', resulting_profile_id: 'orphaned-id' },
    })
    expect(outcome.kind).toBe('create_profile')
    expect(outcome.path).not.toBe(orgOutcomeRoutes('university').dashboard)
  })
})

describe('Spec 05 §20 — suspended precedence (DEF-03)', () => {
  it('suspended Profile overrides pending verification destination', () => {
    const outcome = resolveVerificationOutcome({
      orgType: 'university',
      authenticated: true,
      profile: { status: 'suspended' },
      verification: { status: 'pending_review', resulting_profile_id: null },
    })
    expect(outcome.kind).toBe('suspended')
    expect(outcome.path).toBe(orgOutcomeRoutes('university').suspended)
  })

  it('create-profile gate sends suspended owners to suspended page', () => {
    const gate = resolveUniversityCreateProfileGate({
      profile: { status: 'suspended' },
      verification: { status: 'approved', resulting_profile_id: 'p1' },
    })
    expect(gate.action).toBe('redirect')
    if (gate.action === 'redirect') {
      expect(gate.path).toBe(orgOutcomeRoutes('university').suspended)
    }
  })
})

describe('Spec 05 §20 — owned-profile routing with zero claimed_by reads', () => {
  it('fetchOwnerUniversityProfile queries university_profiles by owner_user_id only', async () => {
    const ownerId = 'uni-owner-1'
    const callLog: Array<{ table: string; op: string; col?: string; val?: string }> = []

    const client = {
      from: (table: string) => {
        callLog.push({ table, op: 'from' })
        return {
          select: () => ({
            eq: (col: string, val: string) => {
              callLog.push({ table, op: 'eq', col, val })
              if (table === 'university_profiles' && col === 'owner_user_id' && val === ownerId) {
                return {
                  neq: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: async () => ({
                          data: {
                            id: 'up-1',
                            owner_user_id: ownerId,
                            directory_id: 'dir-1',
                            status: 'draft',
                            display_name_ar: 'جامعة',
                          },
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }
              }
              if (table === 'companies' && col === 'id' && val === 'dir-1') {
                return {
                  maybeSingle: async () => ({
                    data: { logo_url: null, name_ar: 'جامعة', slug: 'u' },
                    error: null,
                  }),
                }
              }
              return {
                neq: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: async () => ({ data: null, error: null }),
                    }),
                  }),
                }),
                maybeSingle: async () => ({ data: null, error: null }),
              }
            },
          }),
        }
      },
    }

    const profile = await fetchOwnerUniversityProfile(client as never, ownerId)
    expect(profile?.id).toBe('up-1')
    expect(callLog.some((c) => c.table === 'university_profiles')).toBe(true)
    expect(callLog.some((c) => c.col === 'owner_user_id' && c.val === ownerId)).toBe(true)
    expect(callLog.some((c) => c.col === 'claimed_by')).toBe(false)
    expect(callLog.some((c) => c.table === 'companies' && c.col === 'claimed_by')).toBe(false)
  })

  it('university dashboard page uses fetchOwnerUniversityProfile (source)', () => {
    const page = readSrc('src/app/[locale]/(university)/university/dashboard/page.tsx')
    expect(page).toMatch(/fetchOwnerUniversityProfile/)
    expect(page).not.toMatch(/claimed_by/)
  })

  it('company dashboard has no claimed_by / university branch (Spec 05-B)', () => {
    const page = readSrc('src/app/[locale]/(company)/company/dashboard/page.tsx')
    expect(page).toMatch(/fetchOwnerBusinessProfile/)
    expect(page).not.toMatch(/claimed_by/)
    expect(page).not.toMatch(/UniversityDashboard/)
    expect(page).not.toMatch(/from\(['"]university_profiles['"]\)/)
  })
})

describe('Spec 05 §20 — save/reload on university draft surfaces (PSW-001 shipped)', () => {
  it('owner-scoped university update + reload; non-owner denied', async () => {
    const ownerId = 'owner-u'
    const otherId = 'other-u'
    const profileId = 'up-1'
    let stored: Record<string, unknown> = {
      id: profileId,
      owner_user_id: ownerId,
      display_name_ar: 'قبل',
      about_ar: 'نبذة قديمة',
      university_type: 'government',
    }

    const client = {
      from: (table: string) => {
        expect(table).toBe('university_profiles')
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
      ...EMPTY_UNIVERSITY_PROFILE_DRAFT,
      display_name_ar: 'بعد الحفظ',
      about_ar: 'نبذة بعد الحفظ',
      university_type: 'government' as const,
    }

    const denied = await updateOwnerUniversityProfile(
      client as never,
      otherId,
      profileId,
      draft,
    )
    expect(denied).toEqual({ ok: false, reason: 'not_found' })

    const saved = await updateOwnerUniversityProfile(client as never, ownerId, profileId, draft)
    expect(saved).toEqual({ ok: true })

    const reloaded = await readOwnerUniversityProfile(client as never, ownerId, profileId)
    expect(reloaded?.display_name_ar).toBe('بعد الحفظ')
    expect(reloaded?.about_ar).toBe('نبذة بعد الحفظ')
  })
})

describe('Spec 05-B per-defect regressions', () => {
  it('DEF-01/02: create-profile uses gate + Row helper; no resulting_profile_id dashboard shortcut', () => {
    const page = readSrc('src/app/[locale]/(university)/university/create-profile/page.tsx')
    expect(page).toMatch(/resolveUniversityCreateProfileGate/)
    expect(page).toMatch(/fetchOwnerUniversityProfileRow/)
    expect(page).toMatch(/getLatestVerificationForUser/)
    expect(page).not.toMatch(/resulting_profile_id\)\s*\{\s*redirect\('\/university\/dashboard'\)/)
  })

  it('DEF-03: pending-review loads profile row into resolveVerificationOutcome', () => {
    const page = readSrc('src/app/[locale]/(university)/university/pending-review/page.tsx')
    expect(page).toMatch(/fetchOwnerUniversityProfileRow/)
    expect(page).toMatch(/profile: profileRow \? \{ status: profileRow\.status \} : null/)
    expect(page).not.toMatch(/profile:\s*null,\s*\n\s*verification:/)
  })

  it('DEF-05: EmptyUniversityState default CTA is university profile edit', () => {
    const src = readSrc('src/app/[locale]/(company)/_components/empty-university-state.tsx')
    expect(src).toMatch(/ctaHref = '\/university\/profile\/edit'/)
    expect(src).not.toMatch(/\/company\/profile/)
  })

  it('DEF-06: dashboard/empty/layout use next-intl university namespaces', () => {
    expect(readSrc('src/app/[locale]/(company)/_components/university-dashboard.tsx')).toMatch(
      /useTranslations\('university\.dashboard'\)/,
    )
    expect(readSrc('src/app/[locale]/(company)/_components/empty-university-state.tsx')).toMatch(
      /useTranslations\('university\.dashboard\.empty'\)/,
    )
    // Wave 2 responsive-shell fix moved this to a server component consuming
    // getTranslations (same next-intl namespace, resolved server-side and
    // passed as props into the shared ActorSidebarShell client component) —
    // still fully next-intl-driven, matching this test's intent.
    expect(readSrc('src/app/[locale]/(company)/_components/university-layout.tsx')).toMatch(
      /getTranslations\('university\.nav'\)/,
    )
    const en = JSON.parse(readSrc('messages/en.json')) as {
      university: { dashboard: { title: string }; nav: { dashboard: string } }
    }
    const ar = JSON.parse(readSrc('messages/ar.json')) as {
      university: { dashboard: { title: string }; nav: { dashboard: string } }
    }
    expect(en.university.dashboard.title).toBeTruthy()
    expect(ar.university.dashboard.title).toBeTruthy()
    expect(en.university.nav.dashboard).toBeTruthy()
    expect(ar.university.nav.dashboard).toBeTruthy()
  })

  it('DEF-07: fetchOwnerUniversityProfileRow exists and includes suspended', async () => {
    const ownerId = 'u-row'
    const client = {
      from: () => ({
        select: () => ({
          eq: (_col: string, val: string) => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () =>
                  val === ownerId
                    ? { data: { id: 'up-s', status: 'suspended' }, error: null }
                    : { data: null, error: null },
              }),
            }),
          }),
        }),
      }),
    }
    const row = await fetchOwnerUniversityProfileRow(client as never, ownerId)
    expect(row).toEqual({ id: 'up-s', status: 'suspended' })
  })
})

describe('Spec 05-B — claimed_by absence in journey route/query files', () => {
  it('no claimed_by in university routes, company dashboard, or university-dashboard query', () => {
    const paths = [
      'src/app/[locale]/(company)/company/dashboard/page.tsx',
      'src/lib/queries/university-dashboard.ts',
      'src/lib/profile/owner-university-profile.ts',
      ...collectFiles(join(root, 'src/app/[locale]/(university)')).map((p) =>
        p.slice(root.length + 1).replace(/\\/g, '/'),
      ),
    ]

    for (const rel of paths) {
      const src = readSrc(rel)
      expect(src, rel).not.toMatch(/claimed_by/)
    }
  })
})

describe('Spec 05-B — non-owner denial / draft leakage structural', () => {
  it('owner edit/preview require fetchOwnerUniversityProfile', () => {
    const edit = readSrc('src/app/[locale]/(university)/university/profile/edit/page.tsx')
    const preview = readSrc('src/app/[locale]/(university)/university/profile/preview/page.tsx')
    expect(edit).toMatch(/fetchOwnerUniversityProfile/)
    expect(preview).toMatch(/fetchOwnerUniversityProfile/)
    expect(edit).toMatch(/redirect\('\/university\/create-profile'\)/)
  })

  it('catalog public embed requires published status', () => {
    const catalog = readSrc('src/lib/queries/catalog.ts')
    expect(catalog).toMatch(/status === 'published'/)
  })
})

describe('Spec 05-B — university_profiles RLS matrix (policy text; rls_gap=false)', () => {
  it('migration 110 encodes owner read-own, published public read, no draft leak to anon', () => {
    const policy = readSrc('supabase/migrations/110_profile_ownership_policies.sql')
    expect(policy).toMatch(/CREATE POLICY university_profile_public_read_published/)
    expect(policy).toMatch(/USING \(status = 'published'\)/)
    expect(policy).toMatch(/CREATE POLICY university_profile_owner_read_own/)
    expect(policy).toMatch(/USING \(owner_user_id = auth\.uid\(\)\)/)
    expect(policy).toMatch(/CREATE POLICY university_profile_owner_update_content/)
    // Owner select has no status filter → draft + suspended readable by owner.
    const ownerReadBlock = policy.slice(
      policy.indexOf('CREATE POLICY university_profile_owner_read_own'),
      policy.indexOf('CREATE POLICY university_profile_staff_read_all'),
    )
    expect(ownerReadBlock).not.toMatch(/status\s*=/)
    // Public policy is published-only — lawful published visibility is not a gap.
    const publicBlock = policy.slice(
      policy.indexOf('CREATE POLICY university_profile_public_read_published'),
      policy.indexOf('CREATE POLICY university_profile_owner_read_own'),
    )
    expect(publicBlock).toMatch(/status = 'published'/)
    expect(publicBlock).not.toMatch(/draft/)
  })

  it('fetchOwnerUniversityProfile always scopes owner_user_id (server contract)', () => {
    const src = readSrc('src/lib/profile/owner-university-profile.ts')
    expect(src).toMatch(/\.eq\('owner_user_id',\s*userId\)/)
    expect(src).toMatch(/fetchOwnerUniversityProfileRow/)
  })
})
