import { isOnboardingFinished } from '@/lib/onboarding/welcome-router'
import { parseEntitySetupMeta } from '@/lib/onboarding/entity-smart-links'

export type EntityOnboardingProfile = {
  smart_links: Record<string, unknown> | null
  onboarding_completed_at: string | null
  onboarding_skipped_at: string | null
}

export type EntitySetupStep = 'entity' | 'team'

const STEP_PATHS: Record<EntitySetupStep, string> = {
  entity: '/company/entity',
  team: '/company/entity/team',
}

export function entityStepPath(step: EntitySetupStep): string {
  return STEP_PATHS[step]
}

/** Resume path for claim-approved company/university admins (Task 1-ALT). */
export function resolveEntityResumeStep(
  profile: EntityOnboardingProfile,
): EntitySetupStep | 'done' {
  if (isOnboardingFinished(profile)) {
    return 'done'
  }

  const meta = parseEntitySetupMeta(profile.smart_links ?? undefined)
  if (meta.current_step === 'team' || meta.current_step === 'complete') {
    return 'team'
  }
  return 'entity'
}

export function resolveEntityResumePath(profile: EntityOnboardingProfile): string {
  const step = resolveEntityResumeStep(profile)
  if (step === 'done') {
    return '/dashboard'
  }
  return entityStepPath(step)
}

const STEP_ORDER: Record<EntitySetupStep, number> = {
  entity: 1,
  team: 2,
}

export function canAccessEntityStep(
  profile: EntityOnboardingProfile,
  requested: EntitySetupStep,
): boolean {
  const resume = resolveEntityResumeStep(profile)
  if (resume === 'done') {
    return false
  }
  return STEP_ORDER[requested] <= STEP_ORDER[resume]
}
