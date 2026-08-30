import { describe, expect, it } from 'vitest'
import {
  assertNoAggregate,
  buildEvidenceComparisonGrid,
  type ComparisonCriterion,
} from '@/lib/hiring-evidence/evidence-comparison'

const criteria: ComparisonCriterion[] = [
  {
    criterionId: 'c-comm',
    labelAr: 'التواصل',
    labelEn: 'Stakeholder communication',
    method: 'STRUCTURED_INTERVIEW',
    sortOrder: 20,
  },
  {
    criterionId: 'c-sql',
    labelAr: 'SQL',
    labelEn: 'SQL modelling',
    method: 'WORK_SAMPLE',
    sortOrder: 10,
  },
]

const applications = [
  { applicationId: 'app-1', applicantRef: 'anon-1' },
  { applicationId: 'app-2', applicantRef: 'anon-2' },
]

describe('buildEvidenceComparisonGrid', () => {
  it('orders columns by criterion sortOrder and covers every application', () => {
    const grid = buildEvidenceComparisonGrid({
      hiringRoleId: 'role-1',
      stageId: 'stage-int',
      criteria,
      applications,
      observations: [],
      ratings: [],
    })
    expect(grid.criteria.map((c) => c.criterionId)).toEqual(['c-sql', 'c-comm'])
    expect(grid.rows).toHaveLength(2)
    expect(grid.rows[0]?.cells).toHaveLength(2)
  })

  it('lists distinct submitted anchor points side by side without combining them', () => {
    const grid = buildEvidenceComparisonGrid({
      hiringRoleId: 'role-1',
      stageId: 'stage-int',
      criteria,
      applications,
      observations: [
        {
          applicationId: 'app-1',
          criterionId: 'c-comm',
          method: 'STRUCTURED_INTERVIEW',
          evaluatorId: 'e1',
          evidenceFound: true,
        },
        {
          applicationId: 'app-1',
          criterionId: 'c-comm',
          method: 'STRUCTURED_INTERVIEW',
          evaluatorId: 'e2',
          evidenceFound: false,
        },
      ],
      ratings: [
        {
          applicationId: 'app-1',
          criterionId: 'c-comm',
          method: 'STRUCTURED_INTERVIEW',
          evaluatorId: 'e1',
          rubricVersionId: 'rv-1',
          anchorPoint: 4,
          scorecardSubmitted: true,
        },
        {
          applicationId: 'app-1',
          criterionId: 'c-comm',
          method: 'STRUCTURED_INTERVIEW',
          evaluatorId: 'e2',
          rubricVersionId: 'rv-1',
          anchorPoint: 2,
          scorecardSubmitted: true,
        },
      ],
    })
    const cell = grid.rows
      .find((r) => r.applicationId === 'app-1')!
      .cells.find((c) => c.criterionId === 'c-comm')!
    expect(cell.submittedAnchorPoints).toEqual([4, 2])
    expect(cell.observationCount).toBe(2)
    expect(cell.evidenceFoundCount).toBe(1)
    expect(cell.evidenceMissingCount).toBe(1)
    // no aggregate on the cell
    expect(Object.keys(cell)).not.toContain('score')
    expect(Object.keys(cell)).not.toContain('average')
  })

  it('excludes ratings whose evaluator has not submitted their scorecard', () => {
    const grid = buildEvidenceComparisonGrid({
      hiringRoleId: 'role-1',
      stageId: null,
      criteria,
      applications,
      observations: [],
      ratings: [
        {
          applicationId: 'app-2',
          criterionId: 'c-sql',
          method: 'WORK_SAMPLE',
          evaluatorId: 'e9',
          rubricVersionId: 'rv-9',
          anchorPoint: 5,
          scorecardSubmitted: false,
        },
      ],
    })
    const cell = grid.rows
      .find((r) => r.applicationId === 'app-2')!
      .cells.find((c) => c.criterionId === 'c-sql')!
    expect(cell.submittedAnchorPoints).toEqual([])
  })

  it('never emits a per-row total, rank, or match percentage', () => {
    const grid = buildEvidenceComparisonGrid({
      hiringRoleId: 'role-1',
      stageId: null,
      criteria,
      applications,
      observations: [],
      ratings: [],
    })
    for (const row of grid.rows) {
      expect(Object.keys(row).sort()).toEqual(['applicantRef', 'applicationId', 'cells'])
    }
    // whole grid must pass the aggregate guard
    expect(() => assertNoAggregate(grid, 'grid')).not.toThrow()
  })
})

describe('assertNoAggregate', () => {
  it('throws when a payload contains a score/rank/match field', () => {
    expect(() => assertNoAggregate({ candidate: { totalScore: 82 } })).toThrow(/aggregate/i)
    expect(() => assertNoAggregate({ rows: [{ rank: 1 }] })).toThrow()
    expect(() => assertNoAggregate({ match_percentage: 0.9 })).toThrow()
    expect(() => assertNoAggregate({ nested: { deep: { cultureFit: 3 } } })).toThrow()
  })

  it('passes clean evidence payloads', () => {
    expect(() =>
      assertNoAggregate({
        cells: [{ submittedAnchorPoints: [3, 4], observationCount: 2 }],
      }),
    ).not.toThrow()
  })
})
