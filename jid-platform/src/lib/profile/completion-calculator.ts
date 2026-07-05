/**
 * Optimistic profile completion estimate — mirrors DB trigger weights (Section 7.2).
 * NOT authoritative; `recalculate_profile_completion` in Postgres is source of truth.
 */

export type CompletionInput = {
  avatar_url?: string | null
  headline?: string | null
  about_me?: string | null
  university_id?: string | null
  college_id?: string | null
  skill_count?: number
  target_sectors?: string[] | null
  linkedin_url?: string | null
  smart_links?: Record<string, unknown> | null
}

export const COMPLETION_WEIGHTS = {
  avatar: 5,
  headline: 10,
  about_me: 15,
  university_id: 15,
  college_id: 10,
  skills: 20,
  target_sectors: 15,
  linkedin: 10,
} as const

export const COMPLETION_TOTAL = Object.values(COMPLETION_WEIGHTS).reduce((a, b) => a + b, 0)

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function hasLinkedin(input: CompletionInput): boolean {
  if (hasText(input.linkedin_url)) return true
  const fromLinks = input.smart_links?.linkedin
  return typeof fromLinks === 'string' && hasText(fromLinks)
}

/**
 * Returns 0–100 completion percentage using the same weights as the SQL trigger.
 */
export function calculateProfileCompletionPct(input: CompletionInput): number {
  let score = 0

  if (hasText(input.avatar_url)) score += COMPLETION_WEIGHTS.avatar
  if (hasText(input.headline)) score += COMPLETION_WEIGHTS.headline
  if (hasText(input.about_me)) score += COMPLETION_WEIGHTS.about_me
  if (input.university_id) score += COMPLETION_WEIGHTS.university_id
  if (input.college_id) score += COMPLETION_WEIGHTS.college_id
  if ((input.skill_count ?? 0) > 0) score += COMPLETION_WEIGHTS.skills
  if ((input.target_sectors?.length ?? 0) > 0) score += COMPLETION_WEIGHTS.target_sectors
  if (hasLinkedin(input)) score += COMPLETION_WEIGHTS.linkedin

  return Math.min(100, Math.max(0, score))
}

export function deriveProfileStateFromCompletion(
  completionPct: number,
  options?: { suspended_at?: string | null; deleted_at?: string | null },
): 'incomplete' | 'active' | 'suspended' | 'deleted' {
  if (options?.deleted_at) return 'deleted'
  if (options?.suspended_at) return 'suspended'
  return completionPct >= 100 ? 'active' : 'incomplete'
}
