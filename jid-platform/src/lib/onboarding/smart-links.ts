/** Onboarding metadata stored under `profiles.smart_links.onboarding`. */
export type OnboardingSmartLinkMeta = {
  current_step: 1 | 2 | 3 | 'complete'
  degree?: string | null
  gpa_value?: number | null
  gpa_scale?: number | null
  target_job_titles?: string | null
  salary_min?: number | null
  salary_max?: number | null
  step_three_saved_at?: string | null
}

export function parseOnboardingMeta(smartLinks: Record<string, unknown> | null | undefined): OnboardingSmartLinkMeta {
  const raw = smartLinks?.onboarding
  if (!raw || typeof raw !== 'object') {
    return { current_step: 1 }
  }

  const meta = raw as Record<string, unknown>
  const step = meta.current_step
  const current_step =
    step === 2 || step === 3 || step === 'complete' ? step : 1

  return {
    current_step,
    degree: typeof meta.degree === 'string' ? meta.degree : null,
    gpa_value: typeof meta.gpa_value === 'number' ? meta.gpa_value : null,
    gpa_scale: typeof meta.gpa_scale === 'number' ? meta.gpa_scale : null,
    target_job_titles:
      typeof meta.target_job_titles === 'string' ? meta.target_job_titles : null,
    salary_min: typeof meta.salary_min === 'number' ? meta.salary_min : null,
    salary_max: typeof meta.salary_max === 'number' ? meta.salary_max : null,
    step_three_saved_at:
      typeof meta.step_three_saved_at === 'string' ? meta.step_three_saved_at : null,
  }
}

export function mergeOnboardingSmartLinks(
  smartLinks: Record<string, unknown> | null | undefined,
  patch: Partial<OnboardingSmartLinkMeta>,
): Record<string, unknown> {
  const base = smartLinks && typeof smartLinks === 'object' ? { ...smartLinks } : {}
  const current = parseOnboardingMeta(base)

  return {
    ...base,
    onboarding: {
      ...current,
      ...patch,
    },
  }
}
