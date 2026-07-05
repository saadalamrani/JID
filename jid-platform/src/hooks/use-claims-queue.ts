'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchClaimById, fetchClaimsQueue } from '@/lib/staff/claims'
import { createClient } from '@/lib/supabase/client'

export const claimsQueueQueryKey = ['staff', 'claims-queue'] as const

export function useClaimsQueue() {
  return useQuery({
    queryKey: claimsQueueQueryKey,
    queryFn: async () => {
      const supabase = createClient()
      return fetchClaimsQueue(supabase)
    },
    refetchInterval: 30_000,
  })
}

export function useClaimDetail(claimId: string) {
  return useQuery({
    queryKey: [...claimsQueueQueryKey, claimId],
    queryFn: async () => {
      const supabase = createClient()
      return fetchClaimById(supabase, claimId)
    },
    enabled: Boolean(claimId),
  })
}
