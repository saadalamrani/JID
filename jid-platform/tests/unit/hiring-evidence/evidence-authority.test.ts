import { describe, expect, it } from 'vitest'
import {
  canRecordHiringEvidence,
  canSeePeerEvidence,
  canWriteHiringWorkspace,
  checkAiAction,
  type HiringEvidenceViewer,
} from '@/lib/hiring-evidence/evidence-authority'

const viewer = (over: Partial<HiringEvidenceViewer>): HiringEvidenceViewer => ({
  userId: 'u1',
  isStaff: false,
  teamRole: null,
  isProfileOwner: false,
  ...over,
})

describe('hiring evidence authority', () => {
  it('lets interviewers record evidence but not administer config', () => {
    const v = viewer({ teamRole: 'interviewer' })
    expect(canRecordHiringEvidence(v)).toBe(true)
    expect(canWriteHiringWorkspace(v)).toBe(false)
  })

  it('lets recruiters both record and configure', () => {
    const v = viewer({ teamRole: 'recruiter' })
    expect(canRecordHiringEvidence(v)).toBe(true)
    expect(canWriteHiringWorkspace(v)).toBe(true)
  })

  it('gives viewers read-only workspace access, no recording', () => {
    const v = viewer({ teamRole: 'viewer' })
    expect(canRecordHiringEvidence(v)).toBe(false)
    expect(canWriteHiringWorkspace(v)).toBe(false)
  })

  it('denies everything to a non-member non-staff user', () => {
    const v = viewer({})
    expect(canRecordHiringEvidence(v)).toBe(false)
    expect(canWriteHiringWorkspace(v)).toBe(false)
  })
})

describe('evaluator independence', () => {
  it('always shows an evaluator their own evidence', () => {
    expect(
      canSeePeerEvidence({
        viewer: viewer({ userId: 'alice', teamRole: 'interviewer' }),
        owningEvaluatorId: 'alice',
        owningEvaluatorScorecardSubmitted: false,
      }),
    ).toBe(true)
  })

  it('hides a peer evaluator before their scorecard is submitted', () => {
    expect(
      canSeePeerEvidence({
        viewer: viewer({ userId: 'bob', teamRole: 'interviewer' }),
        owningEvaluatorId: 'alice',
        owningEvaluatorScorecardSubmitted: false,
      }),
    ).toBe(false)
  })

  it('reveals a peer evaluator after their scorecard is submitted', () => {
    expect(
      canSeePeerEvidence({
        viewer: viewer({ userId: 'bob', teamRole: 'interviewer' }),
        owningEvaluatorId: 'alice',
        owningEvaluatorScorecardSubmitted: true,
      }),
    ).toBe(true)
  })

  it('lets owners and hiring admins read peers for calibration at any time', () => {
    for (const role of ['owner', 'hiring_admin'] as const) {
      expect(
        canSeePeerEvidence({
          viewer: viewer({ userId: 'mgr', teamRole: role }),
          owningEvaluatorId: 'alice',
          owningEvaluatorScorecardSubmitted: false,
        }),
      ).toBe(true)
    }
  })
})

describe('AI authority boundary', () => {
  it('permits the enumerated assistive actions with a human requester', () => {
    const r = checkAiAction({ action: 'SUMMARIZE_EVIDENCE', humanRequesterId: 'u1' })
    expect(r.allowed).toBe(true)
  })

  it('refuses assistive actions with no human requester (no autonomous AI)', () => {
    const r = checkAiAction({ action: 'SUMMARIZE_EVIDENCE', humanRequesterId: null })
    expect(r.allowed).toBe(false)
  })

  it('refuses every prohibited action', () => {
    for (const action of [
      'SCORE_HUMAN_AS_TRUTH',
      'INFER_PERSONALITY',
      'INFER_PROTECTED_ATTRIBUTE',
      'REJECT_CANDIDATE',
      'HIRE_CANDIDATE',
      'RANK_BY_HIDDEN_MODEL',
    ]) {
      expect(checkAiAction({ action, humanRequesterId: 'u1' }).allowed).toBe(false)
    }
  })

  it('fails closed on unknown actions', () => {
    expect(checkAiAction({ action: 'DO_SOMETHING_NEW', humanRequesterId: 'u1' }).allowed).toBe(
      false,
    )
  })
})
