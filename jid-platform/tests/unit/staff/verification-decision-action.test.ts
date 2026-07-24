/**
 * PSW-002 — Staff Verification Decision Experience.
 *
 * Proves the server-side decision boundary for `reviewVerification`
 * (approve/reject only, self-review hard-denied, reason validation
 * enforced, no false success on server failure) and that the existing
 * P-102 verification RPCs / P-108 analytics-and-notification contracts
 * are used as-is rather than any invented path. No live Supabase project
 * is used — the client is a minimal stub matching the exact chain shape
 * `reviewVerification` calls in src/app/[locale]/(staff)/staff/verification/actions.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const approveVerificationRequest = vi.fn()
const rejectVerificationRequest = vi.fn()
const notifyVerificationDecision = vi.fn()
const trackServer = vi.fn()
const revalidatePath = vi.fn()

vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }))
vi.mock('@/lib/auth/verification', () => ({
  approveVerificationRequest: (...args: unknown[]) => approveVerificationRequest(...args),
  rejectVerificationRequest: (...args: unknown[]) => rejectVerificationRequest(...args),
}))
vi.mock('@/lib/analytics/server', () => ({
  trackServer: (...args: unknown[]) => trackServer(...args),
}))
vi.mock('@/lib/staff/notify-verification-decision', () => ({
  notifyVerificationDecision: (...args: unknown[]) => notifyVerificationDecision(...args),
}))

type FakeUser = { id: string } | null
type FakeVerification = { applicant_user_id: string } | null

let fakeUser: FakeUser = { id: 'staff-1' }
let fakeRole: string | null = 'staff'
let fakeVerification: FakeVerification = { applicant_user_id: 'applicant-1' }

function makeFakeClient() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: fakeUser } }),
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: fakeRole ? { role: fakeRole } : null,
              }),
            }),
          }),
        }
      }
      if (table === 'verification_requests') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: fakeVerification }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table in test stub: ${table}`)
    }),
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => makeFakeClient()),
}))

const VERIFICATION_ID = '11111111-1111-1111-1111-111111111111'
const VALID_REASON = 'This checks out after manual review.'

async function importAction() {
  const mod = await import('@/app/[locale]/(staff)/staff/verification/actions')
  return mod.reviewVerification
}

beforeEach(() => {
  vi.clearAllMocks()
  fakeUser = { id: 'staff-1' }
  fakeRole = 'staff'
  fakeVerification = { applicant_user_id: 'applicant-1' }
})

describe('1. Non-Staff cannot submit a verification decision', () => {
  it('rejects when the caller has no privileged staff role', async () => {
    fakeRole = 'individual'
    const reviewVerification = await importAction()

    const result = await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'approved',
      reason: VALID_REASON,
    })

    expect(result).toEqual({ ok: false, error: 'Only staff can review verification requests' })
    expect(approveVerificationRequest).not.toHaveBeenCalled()
    expect(rejectVerificationRequest).not.toHaveBeenCalled()
    expect(notifyVerificationDecision).not.toHaveBeenCalled()
    expect(trackServer).not.toHaveBeenCalled()
  })

  it('rejects when there is no authenticated user', async () => {
    fakeUser = null
    const reviewVerification = await importAction()

    const result = await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'approved',
      reason: VALID_REASON,
    })

    expect(result).toEqual({ ok: false, error: 'Authentication required' })
  })
})

describe('6. Staff applicant cannot submit a decision on their own verification request', () => {
  it('hard-denies self-review even for an otherwise-valid staff actor', async () => {
    fakeRole = 'staff'
    fakeUser = { id: 'same-person' }
    fakeVerification = { applicant_user_id: 'same-person' }
    const reviewVerification = await importAction()

    const result = await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'approved',
      reason: VALID_REASON,
    })

    expect(result).toEqual({ ok: false, error: 'Cannot review your own verification request' })
    expect(approveVerificationRequest).not.toHaveBeenCalled()
    expect(rejectVerificationRequest).not.toHaveBeenCalled()
    expect(notifyVerificationDecision).not.toHaveBeenCalled()
    expect(trackServer).not.toHaveBeenCalled()
  })
})

describe('9. Approve uses the existing supported decision action (approve_verification_request)', () => {
  it('calls approveVerificationRequest and the approve notification, then reports ok:true', async () => {
    approveVerificationRequest.mockResolvedValue(undefined)
    const reviewVerification = await importAction()

    const result = await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'approved',
      reason: VALID_REASON,
    })

    expect(result).toEqual({ ok: true })
    expect(approveVerificationRequest).toHaveBeenCalledTimes(1)
    expect(approveVerificationRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ verificationId: VERIFICATION_ID, reviewNotes: VALID_REASON }),
    )
    expect(rejectVerificationRequest).not.toHaveBeenCalled()
    expect(notifyVerificationDecision).toHaveBeenCalledWith(
      expect.anything(),
      { verificationId: VERIFICATION_ID, decision: 'approve' },
    )
  })
})

describe('10. Reject uses the existing supported decision action (reject_verification_request)', () => {
  it('calls rejectVerificationRequest and the reject notification, then reports ok:true', async () => {
    rejectVerificationRequest.mockResolvedValue(undefined)
    const reviewVerification = await importAction()

    const result = await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'rejected',
      reason: VALID_REASON,
      requiredDocuments: ['commercial_registry'],
    })

    expect(result).toEqual({ ok: true })
    expect(rejectVerificationRequest).toHaveBeenCalledTimes(1)
    expect(rejectVerificationRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        verificationId: VERIFICATION_ID,
        reviewNotes: VALID_REASON,
        rejectionReason: VALID_REASON,
        requiredDocuments: ['commercial_registry'],
      }),
    )
    expect(approveVerificationRequest).not.toHaveBeenCalled()
    expect(notifyVerificationDecision).toHaveBeenCalledWith(
      expect.anything(),
      { verificationId: VERIFICATION_ID, decision: 'reject' },
    )
  })
})

describe('11. There is no request-more-information action path to call', () => {
  it('rejects a decision value of "needs_more_info" at the schema boundary', async () => {
    const reviewVerification = await importAction()

    const result = await reviewVerification({
      verificationId: VERIFICATION_ID,
      // @ts-expect-error — deliberately invalid: proves the server has no such branch either.
      decision: 'needs_more_info',
      reason: VALID_REASON,
    })

    expect(result.ok).toBe(false)
    expect(approveVerificationRequest).not.toHaveBeenCalled()
    expect(rejectVerificationRequest).not.toHaveBeenCalled()
  })
})

describe('12. Decision reason validation remains enforced', () => {
  it('rejects a reason shorter than 10 characters before any RPC is called', async () => {
    const reviewVerification = await importAction()

    const result = await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'approved',
      reason: 'too short',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/at least 10 characters/i)
    }
    expect(approveVerificationRequest).not.toHaveBeenCalled()
    expect(rejectVerificationRequest).not.toHaveBeenCalled()
  })
})

describe('13. Failed server decisions do not report success', () => {
  it('surfaces the RPC error as ok:false and skips notification/analytics', async () => {
    approveVerificationRequest.mockRejectedValue(new Error('invalid_or_already_reviewed'))
    const reviewVerification = await importAction()

    const result = await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'approved',
      reason: VALID_REASON,
    })

    expect(result).toEqual({ ok: false, error: 'invalid_or_already_reviewed' })
    expect(notifyVerificationDecision).not.toHaveBeenCalled()
    expect(trackServer).not.toHaveBeenCalled()
  })
})

describe('17. External analytics contract is unchanged', () => {
  it('tracks the legacy "staff.claim_reviewed" event name on a successful decision', async () => {
    approveVerificationRequest.mockResolvedValue(undefined)
    const reviewVerification = await importAction()

    await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'approved',
      reason: VALID_REASON,
    })

    expect(trackServer).toHaveBeenCalledWith(
      'staff.claim_reviewed',
      fakeUser?.id,
      expect.objectContaining({ claim_id: VERIFICATION_ID, decision: 'approved' }),
    )
  })
})
