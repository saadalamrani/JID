/**
 * Spec 03-B — university/business reapply eligibility, outcome precedence,
 * approved messaging, terminology, and AR/EN parity.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { canReapplyNow } from '@/lib/entity/rejected-claim'
import {
  orgOutcomeRoutes,
  resolveVerificationOutcome,
} from '@/lib/entity/verification-outcome'

const root = join(__dirname, '../../..')

type Json = Record<string, unknown>

function load(locale: 'en' | 'ar'): Json {
  return JSON.parse(readFileSync(join(root, 'messages', `${locale}.json`), 'utf8')) as Json
}

function placeholders(value: string): string[] {
  const found: string[] = []
  const re = /\{(\w+)\}/g
  let match: RegExpExecArray | null
  while ((match = re.exec(value)) !== null) {
    found.push(match[1]!)
  }
  return found.sort()
}

function assertParity(enNode: unknown, arNode: unknown, path: string) {
  expect(typeof enNode, path).toBe(typeof arNode)
  if (typeof enNode === 'string' && typeof arNode === 'string') {
    expect(placeholders(enNode), path).toEqual(placeholders(arNode))
    expect(enNode.toLowerCase()).not.toMatch(/\bclaims?\b/)
    expect(arNode).not.toMatch(/مطالب/)
    return
  }
  expect(enNode && typeof enNode === 'object').toBe(true)
  expect(arNode && typeof arNode === 'object').toBe(true)
  const enObj = enNode as Json
  const arObj = arNode as Json
  expect(Object.keys(enObj).sort(), path).toEqual(Object.keys(arObj).sort())
  for (const key of Object.keys(enObj)) {
    assertParity(enObj[key], arObj[key], `${path}.${key}`)
  }
}

describe('canReapplyNow eligibility', () => {
  it('blocks university reapply before cooldown and allows after', () => {
    const future = new Date(Date.now() + 60_000).toISOString()
    const past = new Date(Date.now() - 60_000).toISOString()
    expect(canReapplyNow(future)).toBe(false)
    expect(canReapplyNow(past)).toBe(true)
    expect(canReapplyNow(null)).toBe(true)
  })

  it('business reapply eligibility matches university (shared helper regression)', () => {
    const future = new Date(Date.now() + 120_000).toISOString()
    expect(canReapplyNow(future)).toBe(false)
    expect(canReapplyNow(new Date(Date.now() - 1).toISOString())).toBe(true)
  })
})

describe('Spec 03 §8 state-resolution precedence', () => {
  const cases: Array<{
    name: string
    orgType: 'business' | 'university'
    authenticated: boolean
    profile: { status: string } | null
    verification: { status: string; resulting_profile_id: string | null } | null
    kind: string
  }> = [
    {
      name: 'unauthenticated → login',
      orgType: 'business',
      authenticated: false,
      profile: null,
      verification: null,
      kind: 'login',
    },
    {
      name: 'no verification → signup',
      orgType: 'university',
      authenticated: true,
      profile: null,
      verification: null,
      kind: 'signup',
    },
    {
      name: 'pending → pending',
      orgType: 'business',
      authenticated: true,
      profile: null,
      verification: { status: 'pending_review', resulting_profile_id: null },
      kind: 'pending',
    },
    {
      name: 'needs_more_info → needs_more_info on pending path',
      orgType: 'university',
      authenticated: true,
      profile: null,
      verification: { status: 'needs_more_info', resulting_profile_id: null },
      kind: 'needs_more_info',
    },
    {
      name: 'rejected → rejected',
      orgType: 'business',
      authenticated: true,
      profile: null,
      verification: { status: 'rejected', resulting_profile_id: null },
      kind: 'rejected',
    },
    {
      name: 'approved no profile → create_profile',
      orgType: 'university',
      authenticated: true,
      profile: null,
      verification: { status: 'approved', resulting_profile_id: null },
      kind: 'create_profile',
    },
    {
      name: 'approved orphaned resulting_profile_id → create_profile (DEF-04)',
      orgType: 'business',
      authenticated: true,
      profile: null,
      verification: { status: 'approved', resulting_profile_id: 'orphaned' },
      kind: 'create_profile',
    },
    {
      name: 'profile exists → dashboard',
      orgType: 'business',
      authenticated: true,
      profile: { status: 'draft' },
      verification: { status: 'approved', resulting_profile_id: 'p1' },
      kind: 'dashboard',
    },
    {
      name: 'suspended profile → suspended',
      orgType: 'university',
      authenticated: true,
      profile: { status: 'suspended' },
      verification: { status: 'approved', resulting_profile_id: 'p1' },
      kind: 'suspended',
    },
  ]

  for (const c of cases) {
    it(`${c.orgType}: ${c.name}`, () => {
      const outcome = resolveVerificationOutcome({
        orgType: c.orgType,
        authenticated: c.authenticated,
        profile: c.profile,
        verification: c.verification,
      })
      expect(outcome.kind).toBe(c.kind)
      const routes = orgOutcomeRoutes(c.orgType)
      if (c.kind === 'login') expect(outcome.path).toBe(routes.login)
      if (c.kind === 'signup') expect(outcome.path).toBe(routes.signup)
      if (c.kind === 'pending' || c.kind === 'needs_more_info') {
        expect(outcome.path).toBe(routes.pending)
      }
      if (c.kind === 'rejected') expect(outcome.path).toBe(routes.rejected)
      if (c.kind === 'create_profile') expect(outcome.path).toBe(routes.createProfile)
      if (c.kind === 'dashboard') expect(outcome.path).toBe(routes.dashboard)
      if (c.kind === 'suspended') expect(outcome.path).toBe(routes.suspended)
    })
  }

  it('university reapply route follows flat naming convention', () => {
    expect(orgOutcomeRoutes('university').reapply).toBe('/university/reapply')
    expect(orgOutcomeRoutes('business').reapply).toBe('/company/verification/reapply')
  })
})

describe('Approved-without-profile notice copy', () => {
  it('confirms representation and deliberate Profile preparation for both actors', () => {
    const en = load('en') as {
      entity: {
        approvedWithoutProfile: {
          business: Record<string, string>
          university: Record<string, string>
        }
      }
    }
    for (const node of [
      en.entity.approvedWithoutProfile.business,
      en.entity.approvedWithoutProfile.university,
    ]) {
      const message = node.message ?? ''
      const cta = node.cta ?? ''
      const title = node.title ?? ''
      expect(message.toLowerCase()).toMatch(/verification confirms representation/)
      expect(message.toLowerCase()).toMatch(/prepare/)
      expect(message.toLowerCase()).not.toMatch(/licensed/)
      expect(message.toLowerCase()).not.toMatch(/owned profile/)
      expect(cta.toLowerCase()).toMatch(/prepare/)
      expect(title.toLowerCase()).toMatch(/representation has been verified/)
    }
  })
})

describe('Spec 03-B terminology and AR/EN parity', () => {
  it('touched namespaces have matching keys/placeholders and no Claim/مطالبة', () => {
    const en = load('en') as {
      entity: Json
    }
    const ar = load('ar') as {
      entity: Json
    }

    assertParity(en.entity.rejected, ar.entity.rejected, 'entity.rejected')
    assertParity(en.entity.reapply, ar.entity.reapply, 'entity.reapply')
    assertParity(en.entity.pendingReview, ar.entity.pendingReview, 'entity.pendingReview')
    assertParity(en.entity.entityType, ar.entity.entityType, 'entity.entityType')
    assertParity(
      (en.entity.wizard as Json).subtitle,
      (ar.entity.wizard as Json).subtitle,
      'entity.wizard.subtitle',
    )
    assertParity(
      en.entity.approvedWithoutProfile,
      ar.entity.approvedWithoutProfile,
      'entity.approvedWithoutProfile',
    )
  })
})

describe('University reapply page structure (source)', () => {
  it('exists and reuses rejected-claim helpers without forking', () => {
    const page = readFileSync(
      join(
        root,
        'src/app/[locale]/(university)/university/reapply/page.tsx',
      ),
      'utf8',
    )
    expect(page).toMatch(/getLatestRejectedVerification/)
    expect(page).toMatch(/canReapplyNow/)
    expect(page).toMatch(/claimType="university"/)
    expect(page).toMatch(/\/university\/pending-review/)
    expect(page).toMatch(/data-testid="university-reapply-form"/)

    const rejected = readFileSync(
      join(root, 'src/app/[locale]/(university)/university/rejected/page.tsx'),
      'utf8',
    )
    expect(rejected).toMatch(/href="\/university\/reapply"/)
    expect(rejected).not.toMatch(/\/signup\/university/)
    expect(rejected).toMatch(/noReason/)
  })
})
