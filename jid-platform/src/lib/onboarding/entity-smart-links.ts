/** Entity admin onboarding metadata under `profiles.smart_links.entity_setup`. */
export type EntitySetupSmartLinkMeta = {
  current_step: 'entity' | 'team' | 'complete'
  team_step_saved_at?: string | null
}

export function parseEntitySetupMeta(
  smartLinks: Record<string, unknown> | null | undefined,
): EntitySetupSmartLinkMeta {
  const raw = smartLinks?.entity_setup
  if (!raw || typeof raw !== 'object') {
    return { current_step: 'entity' }
  }

  const meta = raw as Record<string, unknown>
  const step = meta.current_step
  const current_step =
    step === 'team' || step === 'complete' ? step : 'entity'

  return {
    current_step,
    team_step_saved_at:
      typeof meta.team_step_saved_at === 'string' ? meta.team_step_saved_at : null,
  }
}

export function mergeEntitySetupSmartLinks(
  smartLinks: Record<string, unknown> | null | undefined,
  patch: Partial<EntitySetupSmartLinkMeta>,
): Record<string, unknown> {
  const base = smartLinks && typeof smartLinks === 'object' ? { ...smartLinks } : {}
  const current = parseEntitySetupMeta(base)

  return {
    ...base,
    entity_setup: {
      ...current,
      ...patch,
    },
  }
}

export function parseMentorSetupMeta(smartLinks: Record<string, unknown> | null | undefined): {
  completed_at: string | null
} {
  const raw = smartLinks?.mentor_setup
  if (!raw || typeof raw !== 'object') {
    return { completed_at: null }
  }
  const meta = raw as Record<string, unknown>
  return {
    completed_at: typeof meta.completed_at === 'string' ? meta.completed_at : null,
  }
}

export function mergeMentorSetupSmartLinks(
  smartLinks: Record<string, unknown> | null | undefined,
  patch: { completed_at: string },
): Record<string, unknown> {
  const base = smartLinks && typeof smartLinks === 'object' ? { ...smartLinks } : {}
  return {
    ...base,
    mentor_setup: {
      ...parseMentorSetupMeta(base),
      ...patch,
    },
  }
}
