/**
 * Completion Wizard weights (Section 6.7 UI) — distinct from DB trigger (Section 7.2).
 */

export type WizardCompletionInput = {
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

export const WIZARD_TASK_WEIGHTS = {
  avatar: 5,
  headline: 10,
  about: 15,
  university: 25,
  skills: 20,
  targets: 15,
  links: 10,
} as const

export type WizardTaskId = keyof typeof WIZARD_TASK_WEIGHTS

export const WIZARD_TASK_IDS = Object.keys(WIZARD_TASK_WEIGHTS) as WizardTaskId[]

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function hasLinks(input: WizardCompletionInput): boolean {
  if (hasText(input.linkedin_url)) return true
  const links = input.smart_links
  if (!links || typeof links !== 'object') return false
  return Object.values(links).some((v) => typeof v === 'string' && hasText(v))
}

export function isWizardTaskComplete(taskId: WizardTaskId, input: WizardCompletionInput): boolean {
  switch (taskId) {
    case 'avatar':
      return hasText(input.avatar_url)
    case 'headline':
      return hasText(input.headline)
    case 'about':
      return hasText(input.about_me)
    case 'university':
      return Boolean(input.university_id || input.college_id)
    case 'skills':
      return (input.skill_count ?? 0) > 0
    case 'targets':
      return (input.target_sectors?.length ?? 0) > 0
    case 'links':
      return hasLinks(input)
    default:
      return false
  }
}

export function calculateWizardCompletionPct(input: WizardCompletionInput): number {
  let score = 0
  for (const taskId of WIZARD_TASK_IDS) {
    if (isWizardTaskComplete(taskId, input)) {
      score += WIZARD_TASK_WEIGHTS[taskId]
    }
  }
  return Math.min(100, Math.max(0, score))
}
