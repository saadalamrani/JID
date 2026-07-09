'use client'

import { useQuery } from '@tanstack/react-query'
import {
  fetchLammahFeedClient,
  fetchLammahWeeklyTeaserCount,
  lammahFeedQueryKey,
  type LammahFeedFilters,
} from '@/lib/lammah/client'

type UseLammahFeedQueryOptions = {
  enabled?: boolean
}

export function useLammahFeedQuery(
  filters: LammahFeedFilters,
  options: UseLammahFeedQueryOptions = {},
) {
  const { enabled = true } = options

  return useQuery({
    queryKey: lammahFeedQueryKey(filters),
    queryFn: () => fetchLammahFeedClient(filters),
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useLammahWeeklyCount(enabled = true) {
  return useQuery({
    queryKey: ['lammah', 'weekly-count'],
    queryFn: fetchLammahWeeklyTeaserCount,
    enabled,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  })
}
