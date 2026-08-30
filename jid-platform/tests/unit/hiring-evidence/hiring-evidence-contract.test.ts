import { describe, expect, it } from 'vitest'
import {
  AI_FORBIDDEN_ACTIONS,
  AI_PERMITTED_ACTIONS,
  ASSESSMENT_METHODS,
  METHOD_TO_EVIDENCE_KIND,
  RUBRIC_SCALE_POINTS,
} from '@/types/contracts/hiring-evidence'
import { HIRING_EVIDENCE_KINDS } from '@/types/contracts/hiring'

describe('Wave 6 hiring-evidence contract (additive to Wave 5)', () => {
  it('maps every assessment method to a Wave 5 evidence-attachment kind', () => {
    for (const method of ASSESSMENT_METHODS) {
      const kind = METHOD_TO_EVIDENCE_KIND[method]
      expect(HIRING_EVIDENCE_KINDS).toContain(kind)
    }
  })

  it('offers only small, odd-friendly rubric scales', () => {
    expect([...RUBRIC_SCALE_POINTS]).toEqual([3, 4, 5])
  })

  it('keeps permitted and forbidden AI actions disjoint', () => {
    const permitted = new Set<string>(AI_PERMITTED_ACTIONS)
    for (const forbidden of AI_FORBIDDEN_ACTIONS) {
      expect(permitted.has(forbidden)).toBe(false)
    }
  })

  it('never enumerates a universal score / ranking as a permitted action', () => {
    expect([...AI_PERMITTED_ACTIONS]).not.toContain('SCORE_HUMAN_AS_TRUTH')
    expect([...AI_PERMITTED_ACTIONS]).not.toContain('RANK_BY_HIDDEN_MODEL')
    expect([...AI_FORBIDDEN_ACTIONS]).toContain('INFER_PROTECTED_ATTRIBUTE')
  })
})
