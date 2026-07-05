'use client'

import { useQuery } from '@tanstack/react-query'
import {
  fetchProfileViewStats,
  profileViewStatsQueryKey,
} from '@/lib/profile/view-stats'

const STALE_MS = 5 * 60 * 1000

export function useProfileViewStats(profileId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: profileViewStatsQueryKey(profileId ?? 'none'),
    queryFn: () => fetchProfileViewStats(profileId!),
    enabled: enabled && Boolean(profileId),
    staleTime: STALE_MS,
    gcTime: STALE_MS * 2,
    refetchOnWindowFocus: false,
  })
}
