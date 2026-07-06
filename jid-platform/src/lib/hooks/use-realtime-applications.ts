'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { track } from '@/lib/analytics/track'
import { userApplicationsQueryKey } from '@/lib/applications/client'
import { createClient } from '@/lib/supabase/client'
import type { ApplicationStatus } from '@/types/application'

type ApplicationRealtimeRow = {
  id: string
  status: ApplicationStatus
  status_changed_by: string | null
  applicant_id: string
}

/**
 * Section 10 — Realtime sync for applicant Radar.
 * Subscribes to applications UPDATE (applicant_id filter), invalidates cache,
 * toasts on company-initiated status changes.
 */
export function useRealtimeApplications(userId: string | null | undefined) {
  const queryClient = useQueryClient()
  const t = useTranslations('radar')

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
        (payload) => {
          const previous = payload.old as Partial<ApplicationRealtimeRow> | undefined
          const current = payload.new as ApplicationRealtimeRow
          const statusChanged = previous?.status != null && previous.status !== current.status
          const companyInitiated =
            current.status_changed_by != null && current.status_changed_by !== userId

          void queryClient.invalidateQueries({ queryKey: userApplicationsQueryKey(userId) })

          if (statusChanged && companyInitiated) {
            toast.message(t('companyStatusUpdate'))
            track('radar_status_updated_by_company', {
              application_id: current.id,
              from_status: previous.status,
              to_status: current.status,
            })
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient, t, userId])
}
