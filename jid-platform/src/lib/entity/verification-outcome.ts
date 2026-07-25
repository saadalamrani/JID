/**
 * Spec 03 §8 — shared verification outcome path resolution for Business and University.
 * Pure helper; pages and organization-profile guards must agree on this precedence.
 */

export type OrganizationActor = 'business' | 'university'

export type VerificationOutcomeKind =
  | 'login'
  | 'signup'
  | 'pending'
  | 'needs_more_info'
  | 'rejected'
  | 'create_profile'
  | 'dashboard'
  | 'suspended'
  | 'unavailable'

export type VerificationOutcome = {
  kind: VerificationOutcomeKind
  path: string
}

const ACTIVE_PENDING_STATUSES = [
  'pending',
  'submitted',
  'pending_review',
  'under_review',
] as const

export function orgOutcomeRoutes(orgType: OrganizationActor) {
  const base = orgType === 'business' ? '/company' : '/university'
  return {
    login: '/login',
    signup: '/signup/entity-type',
    pending:
      orgType === 'business' ? `${base}/verification-pending` : `${base}/pending-review`,
    rejected:
      orgType === 'business' ? `${base}/verification-rejected` : `${base}/rejected`,
    reapply:
      orgType === 'business' ? `${base}/verification/reapply` : `${base}/reapply`,
    createProfile: `${base}/create-profile`,
    dashboard: `${base}/dashboard`,
    suspended: `${base}/profile-suspended`,
  }
}

export function isActivePendingStatus(status: string): boolean {
  return (ACTIVE_PENDING_STATUSES as readonly string[]).includes(status)
}

export function isAwaitingMoreInfoStatus(status: string): boolean {
  return status === 'needs_more_info'
}

/**
 * Spec 03 §8 precedence (authenticated applicant journey):
 * unauthenticated → login;
 * suspended profile → suspended;
 * owned profile exists → dashboard;
 * no verification → signup;
 * active pending / needs_more_info → pending page (needs_more_info renders awaiting copy);
 * rejected → rejected;
 * approved + no resulting Profile → create-profile;
 * approved + resulting Profile → dashboard;
 * else → unavailable/signup.
 */
export function resolveVerificationOutcome(input: {
  orgType: OrganizationActor
  authenticated: boolean
  profile: { status: string } | null
  verification: { status: string; resulting_profile_id: string | null } | null
}): VerificationOutcome {
  const routes = orgOutcomeRoutes(input.orgType)

  if (!input.authenticated) {
    return { kind: 'login', path: routes.login }
  }

  if (input.profile) {
    if (input.profile.status === 'suspended') {
      return { kind: 'suspended', path: routes.suspended }
    }
    return { kind: 'dashboard', path: routes.dashboard }
  }

  const verification = input.verification
  if (!verification) {
    return { kind: 'signup', path: routes.signup }
  }

  if (isAwaitingMoreInfoStatus(verification.status)) {
    return { kind: 'needs_more_info', path: routes.pending }
  }

  if (isActivePendingStatus(verification.status)) {
    return { kind: 'pending', path: routes.pending }
  }

  if (verification.status === 'rejected') {
    return { kind: 'rejected', path: routes.rejected }
  }

  if (verification.status === 'approved') {
    // Profile row already handled above. Without an owned Profile, create-profile
    // is the only safe destination (even if resulting_profile_id is orphaned).
    return { kind: 'create_profile', path: routes.createProfile }
  }

  return { kind: 'unavailable', path: routes.signup }
}
