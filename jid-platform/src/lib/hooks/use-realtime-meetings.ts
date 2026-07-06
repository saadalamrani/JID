'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { timelineMeetingsQueryKey } from '@/lib/queries/timeline'
import { createClient } from '@/lib/supabase/client'

/**
 * Section 10 — Realtime sync for Radar timeline (mentorship_meetings).
 * Invalidates upcoming meetings cache on mentee meeting updates.
 */
export function useRealtimeMeetings(userId: string | null | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`realtime-meetings-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mentorship_meetings',
          filter: `mentee_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: timelineMeetingsQueryKey(userId) })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient, userId])
}
