import { describe, expect, it } from 'vitest'
import {
  COMMERCIAL_PACKAGES,
  PROHIBITED_COMMERCIAL_CLAIMS,
  assertPackagingInvariants,
  packageByOperationalPlan,
  packagesForActor,
  publicPriceIsAdopted,
} from '@/lib/commercial/contracts'

describe('Wave 14 commercial packaging contract', () => {
  it('keeps every package free of adopted public prices', () => {
    expect(() => assertPackagingInvariants()).not.toThrow()
    expect(COMMERCIAL_PACKAGES.every((item) => !publicPriceIsAdopted(item))).toBe(true)
  })

  it('covers three public actors and keeps government contract-only and non-marketplace', () => {
    expect(packagesForActor('individual').map((item) => item.key)).toEqual(['individual_core', 'jid_plus'])
    expect(packagesForActor('business').map((item) => item.key)).toEqual([
      'employer_starter',
      'employer_growth',
      'employer_enterprise',
    ])
    expect(packagesForActor('university').map((item) => item.key)).toEqual([
      'university_core',
      'university_readiness',
      'university_outcomes',
      'university_implementation',
    ])
    expect(packagesForActor('government')).toEqual([])
    const government = COMMERCIAL_PACKAGES.find((item) => item.key === 'government_contract')
    expect(government?.isPublic).toBe(false)
    expect(government?.kind).toBe('contract_only')
  })

  it('maps operational plans without inventing a fourth public actor', () => {
    expect(packageByOperationalPlan('jid_plus')?.actor).toBe('individual')
    expect(packageByOperationalPlan('employer_premium')?.key).toBe('employer_growth')
    expect(packageByOperationalPlan('employer_enterprise')?.actor).toBe('business')
    expect(packageByOperationalPlan('university_outcomes')?.actor).toBe('university')
  })

  it('excludes prohibited commercial claims on every package', () => {
    for (const item of COMMERCIAL_PACKAGES) {
      expect(item.excludedClaims).toEqual(expect.arrayContaining([...PROHIBITED_COMMERCIAL_CLAIMS]))
    }
  })

  it('does not put University reporting behind a privacy paywall package', () => {
    const core = packagesForActor('university').find((item) => item.key === 'university_core')
    expect(core?.kind).toBe('core_free')
    expect(core?.operationalPlanKey).toBeNull()
  })
})
