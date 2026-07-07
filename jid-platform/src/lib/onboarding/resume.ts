import { isOnboardingFinished } from '@/lib/onboarding/welcome-router'
import { parseOnboardingMeta } from '@/lib/onboarding/smart-links'

export type IndividualOnboardingStep = 1 | 2 | 3 | 'complete'

export type IndividualOnboardingProfile = {
  full_name: string | null
  phone: string | null
  university_id: string | null
  graduation_year: number | null
  target_sectors: string[]
  smart_links: Record<string, unknown> | null
  onboarding_completed_at: string | null
  onboarding_skipped_at: string | null
}

const STEP_PATHS: Record<IndividualOnboardingStep, string> = {
  1: '/individual/step-1',
  2: '/individual/step-2',
  3: '/individual/step-3',
  complete: '/individual/complete',
}

export function stepPath(step: IndividualOnboardingStep): string {
  return STEP_PATHS[step]
}

/** Furthest step the user has earned based on saved profile data. */
export function resolveIndividualResumeStep(
  profile: IndividualOnboardingProfile,
): IndividualOnboardingStep | 'done' {
  if (isOnboardingFinished(profile)) {
    return 'done'
  }

  const meta = parseOnboardingMeta(profile.smart_links ?? undefined)

  if (!profile.full_name?.trim() || !profile.phone) {
    return 1
  }

  if (!profile.university_id || !profile.graduation_year || !meta.degree?.trim()) {
    return 2
  }

  if (meta.current_step === 'complete' || meta.step_three_saved_at) {
    return 'complete'
  }

  if (meta.current_step === 3) {
    return 3
  }

  return meta.current_step === 2 ? 2 : 3
}

export function resolveIndividualResumePath(profile: IndividualOnboardingProfile): string {
  const step = resolveIndividualResumeStep(profile)
  if (step === 'done') {
    return '/dashboard'
  }
  return stepPath(step)
}

const STEP_ORDER: Record<IndividualOnboardingStep, number> = {
  1: 1,
  2: 2,
  3: 3,
  complete: 4,
}

/** Block forward jumps; allow revisiting earlier steps. */
export function canAccessIndividualStep(
  profile: IndividualOnboardingProfile,
  requested: IndividualOnboardingStep,
): boolean {
  const resume = resolveIndividualResumeStep(profile)
  if (resume === 'done') {
    return false
  }
  return STEP_ORDER[requested] <= STEP_ORDER[resume]
}
