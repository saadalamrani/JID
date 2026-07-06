import type { MentorFilters, MentorsListResult } from '@/types/mentor'
import { buildMentorSearchParams } from '@/types/mentor'

export async function fetchMentorsClient(
  filters: MentorFilters,
): Promise<MentorsListResult> {
  const params = buildMentorSearchParams(filters)
  const response = await fetch(`/api/mentors?${params.toString()}`)

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Mentors fetch failed')
  }

  return response.json() as Promise<MentorsListResult>
}

export function mentorsQueryKey(filters: Omit<MentorFilters, 'page' | 'limit'>) {
  return ['mentors', 'list', filters] as const
}
