import { describe, expect, it } from 'vitest'
import { assertNoAggregate } from '@/lib/hiring-evidence/evidence-comparison'
import { buildSourcingComparisonGrid } from '@/lib/talent-sourcing/comparison'
import { explainTalentRelevance, hasAnyCriterionEvidence } from '@/lib/talent-sourcing/relevance'
import type { DiscoverableTalentCard } from '@/types/contracts/talent-sourcing'

const sqlCriterion = { id: 'c-sql', labelAr: 'SQL', labelEn: 'SQL modelling' }
const commCriterion = { id: 'c-comm', labelAr: 'التواصل', labelEn: 'Stakeholder communication' }

const candidate: DiscoverableTalentCard = {
  profileId: 'p-1',
  displayName: 'نورة',
  headline: 'Data analyst using SQL',
  about: null,
  targetSectors: [],
  targetProgramTypes: [],
  targetRegions: ['Riyadh'],
  skills: [{ id: 's-1', name: 'SQL', nameAr: 'إس كيو إل' }],
  invitationState: null,
}

describe('explainable relevance', () => {
  it('explains supporting evidence without a match percentage', () => {
    const reasons = explainTalentRelevance(candidate, [sqlCriterion, commCriterion])
    expect(reasons[0]?.evidencePresent).toBe(true)
    expect(reasons[0]?.reasonAr).toContain('ظهرت هذه الخبرة لأنها تدعم معيار')
    expect(reasons[1]?.evidencePresent).toBe(false)
    expect(reasons[1]?.reasonAr).toContain('لا توجد لدينا أدلة كافية')
    assertNoAggregate(reasons, 'relevance reasons')
  })

  it('does not treat discoverable-only people as evidence matches', () => {
    const empty: DiscoverableTalentCard = {
      ...candidate,
      headline: 'Recent graduate',
      skills: [],
    }
    expect(hasAnyCriterionEvidence(empty, [sqlCriterion])).toBe(false)
  })
})

describe('sourcing evidence comparison', () => {
  it('compares per criterion and refuses a universal score', () => {
    const other: DiscoverableTalentCard = {
      ...candidate,
      profileId: 'p-2',
      displayName: 'سالم',
      headline: 'Community organizer',
      skills: [],
    }
    const grid = buildSourcingComparisonGrid({
      hiringRoleId: 'role-1',
      criteria: [sqlCriterion, commCriterion],
      candidates: [candidate, other],
    })
    expect(grid.rows).toHaveLength(2)
    expect(grid.rows[0]?.cells[0]?.evidencePresent).toBe(true)
    expect(grid.rows[1]?.cells[0]?.evidencePresent).toBe(false)
    expect(JSON.stringify(grid)).not.toMatch(/match|rank|score|percentile/i)
  })

  it('throws if a caller attaches a match percentage', () => {
    expect(() => assertNoAggregate({ matchPercent: 92 }, 'forbidden')).toThrow(/forbidden aggregate/i)
  })
})
