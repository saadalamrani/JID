import { describe, expect, it } from 'vitest'
import {
  SEVERITY_CONTRACT,
  classifyFailure,
  isPromotionBlocker,
  parseSeverityTag,
} from '../../e2e/release-smoke/helpers/severity'
import {
  FORBIDDEN_CLAIM_COPY,
  PUBLIC_SMOKE_ROUTES,
  VIEWPORTS,
} from '../../e2e/release-smoke/helpers/routes'
import { isKnownDeadLinkCandidate } from '../../e2e/release-smoke/helpers/selectors'
import { RELEASE_SMOKE_AUTH_ACTORS } from '../../e2e/release-smoke/helpers/auth'

describe('release smoke harness contracts', () => {
  it('marks only P0/P1 as promotion blockers', () => {
    expect(isPromotionBlocker('P0')).toBe(true)
    expect(isPromotionBlocker('P1')).toBe(true)
    expect(isPromotionBlocker('P2')).toBe(false)
    expect(isPromotionBlocker('P3')).toBe(false)
    expect(SEVERITY_CONTRACT.P0.promotionBlocker).toBe(true)
    expect(SEVERITY_CONTRACT.P2.reason).toMatch(/non-blocking/i)
  })

  it('parses severity tags and classifies failures', () => {
    expect(parseSeverityTag('@p1')).toBe('P1')
    expect(parseSeverityTag('P0')).toBe('P0')
    expect(parseSeverityTag('nope')).toBeNull()

    expect(
      classifyFailure({ annotatedSeverity: 'P2', message: 'timeout on route' }),
    ).toBe('P2')
    expect(classifyFailure({ message: 'unauthorized leak of PII' })).toBe('P0')
    expect(classifyFailure({ message: 'Hydration failed on /catalog' })).toBe('P1')
    expect(classifyFailure({ message: 'locale landmark missing' })).toBe('P2')
    expect(classifyFailure({ message: 'button padding off by 2px' })).toBe('P3')
  })

  it('covers the stable public route matrix', () => {
    const ids = PUBLIC_SMOKE_ROUTES.map((r) => r.id)
    expect(ids).toEqual(['home', 'catalog', 'opportunities', 'login', 'signup', 'entity-type'])
    expect(VIEWPORTS.desktop.width).toBeGreaterThan(VIEWPORTS.mobile.width)
    expect(FORBIDDEN_CLAIM_COPY.length).toBeGreaterThan(0)
    expect(isKnownDeadLinkCandidate('/todo')).toBe(true)
    expect(isKnownDeadLinkCandidate('/catalog')).toBe(false)
  })

  it('reuses deterministic seed actors only', () => {
    expect(RELEASE_SMOKE_AUTH_ACTORS.map((a) => a.id)).toEqual([
      'individual',
      'business',
      'university',
    ])
    for (const actor of RELEASE_SMOKE_AUTH_ACTORS) {
      expect(actor.email.endsWith('@jidseed.test')).toBe(true)
    }
  })
})
