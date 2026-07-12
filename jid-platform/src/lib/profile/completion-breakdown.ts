import {
  COMPLETION_WEIGHTS,
  type CompletionInput,
  calculateProfileCompletionPct,
} from '@/lib/profile/completion-calculator'

export type CompletionBreakdownItemId = keyof typeof COMPLETION_WEIGHTS

export type CompletionBreakdownItem = {
  id: CompletionBreakdownItemId
  weight: number
  complete: boolean
  editFocus?: string
}

const ITEM_ORDER: CompletionBreakdownItemId[] = [
  'about_me',
  'skills',
  'headline',
  'university_id',
  'college_id',
  'target_sectors',
  'avatar',
  'linkedin',
]

const FOCUS_MAP: Partial<Record<CompletionBreakdownItemId, string>> = {
  avatar: 'avatar',
  headline: 'headline',
  about_me: 'about',
  university_id: 'university',
  college_id: 'university',
  skills: 'skills',
  target_sectors: 'targets',
  linkedin: 'links',
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function hasLinkedin(input: CompletionInput): boolean {
  if (hasText(input.linkedin_url)) return true
  const fromLinks = input.smart_links?.linkedin
  return typeof fromLinks === 'string' && hasText(fromLinks)
}

function isComplete(id: CompletionBreakdownItemId, input: CompletionInput): boolean {
  switch (id) {
    case 'avatar':
      return hasText(input.avatar_url)
    case 'headline':
      return hasText(input.headline)
    case 'about_me':
      return hasText(input.about_me)
    case 'university_id':
      return Boolean(input.university_id)
    case 'college_id':
      return Boolean(input.college_id)
    case 'skills':
      return (input.skill_count ?? 0) > 0
    case 'target_sectors':
      return (input.target_sectors?.length ?? 0) > 0
    case 'linkedin':
      return hasLinkedin(input)
    default:
      return false
  }
}

/** Missing profile items ordered by impact (weight desc), DB trigger weights SSOT. */
export function buildCompletionBreakdown(input: CompletionInput): {
  pct: number
  items: CompletionBreakdownItem[]
  missing: CompletionBreakdownItem[]
} {
  const items = ITEM_ORDER.map((id) => ({
    id,
    weight: COMPLETION_WEIGHTS[id],
    complete: isComplete(id, input),
    editFocus: FOCUS_MAP[id],
  }))

  const missing = items.filter((item) => !item.complete).sort((a, b) => b.weight - a.weight)

  return {
    pct: calculateProfileCompletionPct(input),
    items,
    missing,
  }
}
