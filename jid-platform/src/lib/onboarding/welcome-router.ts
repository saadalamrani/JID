import type { UserRole } from '@/lib/auth/rbac'

export type OnboardingProfileSnapshot = {
  role: UserRole
  onboarding_completed_at: string | null
  onboarding_skipped_at: string | null
}

export function isOnboardingFinished(profile: OnboardingProfileSnapshot): boolean {
  return Boolean(profile.onboarding_completed_at ?? profile.onboarding_skipped_at)
}

/**
 * Section 10 — corrected welcome router (Day 1 Part A).
 *
 * Implemented branch: `company_admin` / `university_admin` are granted only via
 * approved claim_requests — never at individual signup. Signup sets `individual`
 * (or `entity` for entity wizard). No user has `role = 'mentor'` at signup.
 */
export function resolveWelcomeDestination(role: UserRole): string {
  if (role === 'individual') {
    return '/individual/step-1'
  }

  if (role === 'company_admin' || role === 'university_admin') {
    return '/company/entity'
  }

  return '/dashboard'
}
