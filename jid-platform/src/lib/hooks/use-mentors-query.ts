'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchMentorsClient, mentorsQueryKey } from '@/lib/mentors/client'
import type { MentorFilters, MentorsListResult } from '@/types/mentor'
import { DEFAULT_MENTOR_FILTERS } from '@/types/mentor'

type UseMentorsQueryOptions = {
  initialData?: MentorsListResult
  enabled?: boolean
}

export function useMentorsQuery(
  filters: Omit<MentorFilters, 'page' | 'limit'>,
  options: UseMentorsQueryOptions = {},
) {
  const { enabled = true, initialData } = options

  return useQuery({
    queryKey: mentorsQueryKey(filters),
    enabled,
    queryFn: () =>
      fetchMentorsClient({
        ...filters,
        page: DEFAULT_MENTOR_FILTERS.page,
        limit: DEFAULT_MENTOR_FILTERS.limit,
      }),
    initialData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
