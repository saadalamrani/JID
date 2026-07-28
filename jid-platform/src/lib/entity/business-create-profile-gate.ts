/**
 * Spec 04-B — pure create-profile page gate (DEF-03 / DEF-04 / DEF-05).
 * Profile row (incl. suspended) wins; otherwise Spec §8 outcome decides.
 * Orphaned resulting_profile_id must stay on the wizard (honest recovery), never loop to dashboard.
 */
import {
  resolveVerificationOutcome,
  type VerificationOutcome,
} from '@/lib/entity/verification-outcome'

export type CreateProfileGateInput = {
  profile: { status: string } | null
  verification: { status: string; resulting_profile_id: string | null } | null
}

export type CreateProfileGateResult =
  | { action: 'stay'; outcome: VerificationOutcome }
  | { action: 'redirect'; path: string; outcome: VerificationOutcome }

export function resolveBusinessCreateProfileGate(
  input: CreateProfileGateInput,
): CreateProfileGateResult {
  const outcome = resolveVerificationOutcome({
    orgType: 'business',
    authenticated: true,
    profile: input.profile,
    // When an owned Profile exists, verification must not override Spec §8 profile precedence.
    verification: input.profile ? null : input.verification,
  })

  if (outcome.kind === 'create_profile') {
    return { action: 'stay', outcome }
  }

  return { action: 'redirect', path: outcome.path, outcome }
}
