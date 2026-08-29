import { describe, expect, it } from 'vitest'
import {
  CANDIDATE_VISIBLE_STATUSES,
  HIRING_EVIDENCE_KINDS,
  HIRING_OUTCOMES,
  HIRING_STAGE_KINDS,
} from '@/types/contracts/hiring'

describe('Wave 5 frozen hiring contract', () => {
  it('separates workflow stages from terminal outcomes', () => {
    expect(HIRING_STAGE_KINDS).toContain('INTERVIEW')
    expect(HIRING_OUTCOMES).not.toContain('INTERVIEW')
    expect(HIRING_OUTCOMES).toEqual([
      'HIRED',
      'NOT_SELECTED',
      'WITHDRAWN',
      'ROLE_CANCELLED',
    ])
  })

  it('does not encode silence or hidden employer state as a candidate status', () => {
    expect(CANDIDATE_VISIBLE_STATUSES).not.toContain('SILENT')
    expect(CANDIDATE_VISIBLE_STATUSES).not.toContain('REJECTED_BY_INACTIVITY')
  })

  it('provides evidence attachment kinds without a universal score', () => {
    expect(HIRING_EVIDENCE_KINDS).toContain('WORK_SAMPLE')
    expect(HIRING_EVIDENCE_KINDS).toContain('RUBRIC_OBSERVATION')
    expect(HIRING_EVIDENCE_KINDS).not.toContain('CANDIDATE_SCORE')
    expect(HIRING_EVIDENCE_KINDS).not.toContain('CULTURE_FIT')
  })
})
