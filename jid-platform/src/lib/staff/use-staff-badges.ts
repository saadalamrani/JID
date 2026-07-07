'use client'

import { useQuery } from '@tanstack/react-query'
import type { StaffBadgeCounts } from '@/lib/staff/badges'

const STAFF_BADGE_POLL_MS = 30_000

async function fetchStaffBadges(): Promise<StaffBadgeCounts> {
  const response = await fetch('/api/staff/badges', { credentials: 'same-origin' })
  if (!response.ok) {
    throw new Error('Failed to load staff badge counts')
  }
  return response.json() as Promise<StaffBadgeCounts>
}

/** SWR-style polling for live sidebar badge counts (Section 5.1). */
export function useStaffBadges() {
  return useQuery({
    queryKey: ['staff-badges'],
    queryFn: fetchStaffBadges,
    refetchInterval: STAFF_BADGE_POLL_MS,
    staleTime: STAFF_BADGE_POLL_MS,
    retry: 1,
  })
}
