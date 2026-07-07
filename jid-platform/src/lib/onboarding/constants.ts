/** Section 10.3 — onboarding step flows (no mentor branch). */
export const ONBOARDING_FLOWS = {
  individual: [
    { id: 'step-1', path: '/individual/step-1' },
    { id: 'step-2', path: '/individual/step-2' },
    { id: 'step-3', path: '/individual/step-3' },
  ],
  company: [
    { id: 'entity', path: '/company/entity' },
    { id: 'team', path: '/company/entity/team' },
  ],
} as const

export type OnboardingFlowKey = keyof typeof ONBOARDING_FLOWS

export type OnboardingStep = (typeof ONBOARDING_FLOWS)[OnboardingFlowKey][number]

/** Resolve which progress flow to show from the current pathname. */
export function resolveOnboardingFlowKey(pathname: string): OnboardingFlowKey | null {
  const normalized = pathname.replace(/^\/(ar|en)/, '') || '/'

  if (normalized.startsWith('/individual')) {
    return 'individual'
  }

  if (normalized.startsWith('/company/entity/team')) {
    return 'company'
  }

  if (normalized.startsWith('/company/entity')) {
    return 'company'
  }

  return null
}
