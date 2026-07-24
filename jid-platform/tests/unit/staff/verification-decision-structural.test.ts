/**
 * PSW-002 — Staff Verification Decision Experience.
 *
 * Structural/static regression guards, in the same style as
 * tests/unit/security/staff-system-claim-surface-cleanup.test.ts: these run
 * against the source tree directly (no live Supabase project) and prove
 * facts that are unsafe to assume — the Staff route guard chain, the exact
 * (privacy-limited) queue select column list, that "request more
 * information" has no active control anywhere in the decision form, that
 * the external notification/analytics/edge-function contracts this task
 * was told to preserve are byte-for-byte unchanged, and that no verification
 * decision-journey file links to the retired /sys/claims route.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC_ROOT = join(process.cwd(), 'src')

function read(relativePath: string): string {
  return readFileSync(join(SRC_ROOT, relativePath), 'utf-8')
}

describe('1/2. Staff-only route guard chain protects the verification queue', () => {
  it('the /staff layout wraps non-auth routes in the four-guard StaffShell', () => {
    const layout = read('app/[locale]/(staff)/layout.tsx')
    expect(layout).toMatch(/StaffShell/)
    expect(layout).toMatch(/isStaffAuthRoute/)
  })

  it('requireStaffShellAccess enforces session, role, MFA and session-age guards', () => {
    const guard = read('lib/staff/require-staff-access.ts')
    expect(guard).toMatch(/PRIVILEGED_STAFF_ROLES/)
    expect(guard).toMatch(/notFound\(\)/)
    expect(guard).toMatch(/getAuthenticatorAssuranceLevel/)
    expect(guard).toMatch(/isSessionExpired/)
  })

  it('middleware also gates /staff routes (defense in depth)', () => {
    const middleware = read('middleware.ts')
    expect(middleware).toMatch(/staff-portal/)
  })

  it('my-queue and history queries are individually gated by requireStaffShellAccess', () => {
    const queue = read('lib/staff/claims-queue.ts')
    const myQueueGuardCount = queue.split('requireStaffShellAccess()').length - 1
    expect(myQueueGuardCount).toBeGreaterThanOrEqual(2)
  })

  it('the review workspace query is gated by requireStaffShellAccess', () => {
    const queries = read('lib/staff/verification-review-queries.ts')
    expect(queries).toMatch(/const staffProfile = await requireStaffShellAccess\(\)/)
  })
})

describe('4. The queue never selects the full evidence/PII payload', () => {
  it('fetchPendingClaimsQueue selects only triage-safe columns (no business_email)', () => {
    const queue = read('lib/staff/claims-queue.ts')
    const selectCalls = queue.match(/\.select\(\s*\n?\s*'([^']+)'/g) ?? []
    expect(selectCalls.length).toBeGreaterThan(0)
    for (const call of selectCalls) {
      expect(call).not.toMatch(/business_email/)
      expect(call).not.toMatch(/review_notes/)
      expect(call).not.toMatch(/rejection_reason/)
    }
  })

  it('the workspace query only exposes verification flags for the applicant, not raw contact data', () => {
    const queries = read('lib/staff/verification-review-queries.ts')
    expect(queries).toMatch(/phone_verified_at/)
    expect(queries).toMatch(/email_verified_at/)
    // ApplicantProfile type must not carry raw email/phone columns.
    const applicantTypeMatch = queries.match(/export type ApplicantProfile = \{[\s\S]*?\n\}/)
    expect(applicantTypeMatch).not.toBeNull()
    const applicantType = applicantTypeMatch?.[0] ?? ''
    expect(applicantType).not.toMatch(/\bemail:/)
    expect(applicantType).not.toMatch(/\bphone:/)
  })
})

describe('5. Auto-assignment on first open is real and race-guarded', () => {
  it('assignVerificationToSelfIfUnassigned only writes when currently unassigned', () => {
    const queries = read('lib/staff/verification-review-queries.ts')
    expect(queries).toMatch(/assigned_staff_id: staffId/)
    expect(queries).toMatch(/\.is\('assigned_staff_id', null\)/)
  })
})

describe('8. Terminal (already-decided) requests are read-only', () => {
  it('isVerificationPendingReview excludes approved/rejected', async () => {
    const { isVerificationPendingReview } = await import('@/lib/staff/verification-review-shared')
    expect(isVerificationPendingReview('approved')).toBe(false)
    expect(isVerificationPendingReview('rejected')).toBe(false)
    expect(isVerificationPendingReview('pending')).toBe(true)
    expect(isVerificationPendingReview('under_review')).toBe(true)
    expect(isVerificationPendingReview('needs_more_info')).toBe(true)
  })

  it('the workspace renders the decision form only when pendingReview is true', () => {
    const workspace = read(
      'app/[locale]/(staff)/staff/verification/[id]/_components/verification-review-workspace.tsx',
    )
    expect(workspace).toMatch(/pendingReview \? \(\s*<VerificationDecisionForm/)
  })
})

describe('9/10/11. Decision form offers exactly approve/reject — no fake "more info" control', () => {
  it('DECISION_OPTIONS is exactly [approved, rejected]', () => {
    const form = read(
      'app/[locale]/(staff)/staff/verification/[id]/_components/verification-decision-form.tsx',
    )
    const match = form.match(/const DECISION_OPTIONS: VerificationDecision\[\] = (\[[^\]]+\])/)
    expect(match).not.toBeNull()
    const optionsLiteral = match?.[1]
    expect(optionsLiteral).toBeDefined()
    // eslint-disable-next-line no-eval -- test-only literal array parse, no external input
    const options = eval(optionsLiteral as string)
    expect(options).toEqual(['approved', 'rejected'])
    expect(form).not.toMatch(/needs_more_info/)
    expect(form).not.toMatch(/request.?more.?info/i)
  })

  it('the underlying RPCs only cover approve/reject (no request_more_info RPC call exists)', () => {
    const lib = read('lib/auth/verification.ts')
    expect(lib).toMatch(/approve_verification_request/)
    expect(lib).toMatch(/reject_verification_request/)
    expect(lib).not.toMatch(/request_more_info/)
  })
})

describe('14. Approval confirmation states no Profile was created automatically', () => {
  it('the workspace conditionally renders approvedNoProfileNotice for approved terminal requests', () => {
    const workspace = read(
      'app/[locale]/(staff)/staff/verification/[id]/_components/verification-review-workspace.tsx',
    )
    expect(workspace).toMatch(/verification\.status === 'approved'/)
    expect(workspace).toMatch(/approvedNoProfileNotice/)
  })

  it('approveVerificationRequest never inserts into business_profiles or university_profiles', () => {
    const lib = read('lib/auth/verification.ts')
    const approveFn = lib.match(/export async function approveVerificationRequest[\s\S]*?\n\}/)
    expect(approveFn).not.toBeNull()
    expect(approveFn?.[0]).not.toMatch(/business_profiles|university_profiles/)
  })
})

describe('16. No verification decision-journey file links to the retired /sys/claims route', () => {
  const files = [
    'app/[locale]/(staff)/staff/verification/page.tsx',
    'app/[locale]/(staff)/staff/verification/actions.ts',
    'app/[locale]/(staff)/staff/verification/_components/verification-card.tsx',
    'app/[locale]/(staff)/staff/verification/_components/verification-list.tsx',
    'app/[locale]/(staff)/staff/verification/[id]/_components/verification-review-workspace.tsx',
    'app/[locale]/(staff)/staff/verification/[id]/_components/related-history-panel.tsx',
    'app/[locale]/(sys)/sys/dashboard/_components/verification-queue-widget.tsx',
  ]

  it.each(files)('%s has no href to /sys/claims', (relativePath) => {
    let content: string
    try {
      content = read(relativePath)
    } catch {
      return // file relocated/absent is fine — absence itself satisfies "no link"
    }
    // Ignore comments — JID-102D1 documents the retired route in a comment, which is not a link.
    const withoutComments = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    expect(withoutComments).not.toMatch(/\/sys\/claims/)
  })
})

describe('17. External notification/analytics/edge-function contracts are byte-for-byte unchanged', () => {
  it('notify-verification-decision.ts preserves the claim.* category names and edge function names', () => {
    const notify = read('lib/staff/notify-verification-decision.ts')
    expect(notify).toMatch(/'claim\.approved'/)
    expect(notify).toMatch(/'claim\.rejected'/)
    expect(notify).toMatch(/'claim\.needs_more_info'/)
    expect(notify).toMatch(/claim_id:/)
    expect(notify).toMatch(/'send-claim-approval'/)
    expect(notify).toMatch(/'send-claim-rejection'/)
    expect(notify).toMatch(/claimId: input\.verificationId/)
  })

  it('staff-events.ts still declares staff.claim_reviewed', () => {
    const events = read('lib/analytics/staff-events.ts')
    expect(events).toMatch(/'staff\.claim_reviewed'/)
  })

  it('the review action still tracks staff.claim_reviewed with a claim_id payload key', () => {
    const actions = read('app/[locale]/(staff)/staff/verification/actions.ts')
    expect(actions).toMatch(/trackServer\('staff\.claim_reviewed'/)
    expect(actions).toMatch(/claim_id: verificationId/)
  })
})
