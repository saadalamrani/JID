/**
 * Spec 05-B — pure university create-profile page gate (DEF-01 / DEF-02).
 * Profile row (incl. suspended) wins; otherwise Spec §8 outcome decides.
 * Orphaned resulting_profile_id must stay on the wizard (honest recovery), never loop to dashboard.
 */
import { resolveVerificationOutcome } from '@/lib/entity/verification-outcome'
import type { CreateProfileGateInput, CreateProfileGateResult } from '@/lib/entity/business-create-profile-gate'

export type { CreateProfileGateInput, CreateProfileGateResult }

export function resolveUniversityCreateProfileGate(
  input: CreateProfileGateInput,
): CreateProfileGateResult {
  const outcome = resolveVerificationOutcome({
    orgType: 'university',
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
