/**
 * Spec 02 / Session B — assigned-reviewer authorization at the action layer.
 *
 * Does not modify PSW-002 assertions; covers admin denial, override RPC
 * selection for super_admin, and self-review-before-RPC-selection.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const approveVerificationRequest = vi.fn()
const rejectVerificationRequest = vi.fn()
const approveVerificationRequestOverride = vi.fn()
const rejectVerificationRequestOverride = vi.fn()
const notifyVerificationDecision = vi.fn()
const trackServer = vi.fn()
const revalidatePath = vi.fn()

vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }))
vi.mock('@/lib/auth/verification', () => ({
  approveVerificationRequest: (...args: unknown[]) => approveVerificationRequest(...args),
  rejectVerificationRequest: (...args: unknown[]) => rejectVerificationRequest(...args),
  approveVerificationRequestOverride: (...args: unknown[]) =>
    approveVerificationRequestOverride(...args),
  rejectVerificationRequestOverride: (...args: unknown[]) =>
    rejectVerificationRequestOverride(...args),
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

describe('Spec 02-B action authorization', () => {
  it('rejects admin before any RPC for both override and non-override input', async () => {
    fakeRole = 'admin'
    const reviewVerification = await importAction()

    const withoutOverride = await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'approved',
      reason: VALID_REASON,
    })
    const withOverride = await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'rejected',
      reason: VALID_REASON,
      overrideAssignment: true,
    })

    expect(withoutOverride).toEqual({
      ok: false,
      error: 'Admin cannot decide verification requests',
    })
    expect(withOverride).toEqual({
      ok: false,
      error: 'Admin cannot decide verification requests',
    })
    expect(approveVerificationRequest).not.toHaveBeenCalled()
    expect(rejectVerificationRequest).not.toHaveBeenCalled()
    expect(approveVerificationRequestOverride).not.toHaveBeenCalled()
    expect(rejectVerificationRequestOverride).not.toHaveBeenCalled()
  })

  it('staff always uses the normal RPC and never reaches an override RPC', async () => {
    fakeRole = 'staff'
    const reviewVerification = await importAction()

    await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'approved',
      reason: VALID_REASON,
      overrideAssignment: true,
    })

    expect(approveVerificationRequest).toHaveBeenCalledTimes(1)
    expect(approveVerificationRequestOverride).not.toHaveBeenCalled()
    expect(rejectVerificationRequestOverride).not.toHaveBeenCalled()
  })

  it('super_admin without overrideAssignment uses the normal RPC only', async () => {
    fakeRole = 'super_admin'
    fakeUser = { id: 'super-1' }
    const reviewVerification = await importAction()

    await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'rejected',
      reason: VALID_REASON,
    })

    expect(rejectVerificationRequest).toHaveBeenCalledTimes(1)
    expect(rejectVerificationRequestOverride).not.toHaveBeenCalled()
    expect(approveVerificationRequestOverride).not.toHaveBeenCalled()
  })

  it('super_admin with overrideAssignment=true calls the override RPC', async () => {
    fakeRole = 'super_admin'
    fakeUser = { id: 'super-1' }
    const reviewVerification = await importAction()

    await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'approved',
      reason: VALID_REASON,
      overrideAssignment: true,
    })

    expect(approveVerificationRequestOverride).toHaveBeenCalledTimes(1)
    expect(approveVerificationRequest).not.toHaveBeenCalled()
  })

  it('denies self-review for super_admin with override before any RPC selection', async () => {
    fakeRole = 'super_admin'
    fakeUser = { id: 'super-1' }
    fakeVerification = { applicant_user_id: 'super-1' }
    const reviewVerification = await importAction()

    const result = await reviewVerification({
      verificationId: VERIFICATION_ID,
      decision: 'approved',
      reason: VALID_REASON,
      overrideAssignment: true,
    })

    expect(result).toEqual({
      ok: false,
      error: 'Cannot review your own verification request',
    })
    expect(approveVerificationRequest).not.toHaveBeenCalled()
    expect(approveVerificationRequestOverride).not.toHaveBeenCalled()
    expect(rejectVerificationRequest).not.toHaveBeenCalled()
    expect(rejectVerificationRequestOverride).not.toHaveBeenCalled()
  })
})
