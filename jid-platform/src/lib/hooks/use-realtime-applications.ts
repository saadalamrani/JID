'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { userApplicationsQueryKey } from '@/lib/applications/client'
import { createClient } from '@/lib/supabase/client'

/**
 * Section 5.4 — Realtime sync for applicant Radar.
 * Subscribes to applications UPDATE where applicant_id = user (spec: user_id).
 * Invalidates TanStack Query cache on change.
 */
export function useRealtimeApplications(userId: string | null | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`realtime-applications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `applicant_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: userApplicationsQueryKey(userId) })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
