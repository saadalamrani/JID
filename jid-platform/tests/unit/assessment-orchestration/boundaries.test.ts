import { describe, expect, it } from 'vitest'
import { ASSESSMENT_ASSIGNMENT_STATES, FAILURE_STATES, isCandidateNegativeEvidence, maySetHiringOutcomeFromAssessment } from '@/types/contracts/assessment-orchestration'

describe('Wave 7 assessment boundaries', () => {
  it('keeps explicit technical/provider states distinct from completion and withdrawal', () => {
    expect(ASSESSMENT_ASSIGNMENT_STATES).toEqual(expect.arrayContaining(['invited','ready','started','completed','expired','withdrawn','cancelled','technical_failure','provider_failure']))
    expect(FAILURE_STATES).toEqual(['technical_failure','provider_failure'])
  })
  it('never treats orchestration state as negative candidate evidence or a hiring outcome', () => {
    for (const state of ASSESSMENT_ASSIGNMENT_STATES) expect(isCandidateNegativeEvidence(state)).toBe(false)
    expect(maySetHiringOutcomeFromAssessment()).toBe(false)
  })
})
