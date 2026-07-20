'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type VerificationRealtimeRow = {
  id: string
  company_name: string
  status: string
}

/**
 * Section 7.3 — Supabase Realtime on verification_requests (INSERT + status UPDATE).
 * One channel per tab; staff team size stays well under free-tier 200 connections.
 */
export function RealtimeVerificationUpdater() {
  const t = useTranslations('staff.claims.realtime')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('staff-verification-queue')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'verification_requests' },
        (payload) => {
          const row = payload.new as VerificationRealtimeRow
          toast.message(t('newClaim', { company: row.company_name }))
          router.refresh()
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'verification_requests' },
        (payload) => {
          const previous = payload.old as Partial<VerificationRealtimeRow> | undefined
          const current = payload.new as VerificationRealtimeRow
          if (previous?.status != null && previous.status !== current.status) {
            router.refresh()
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [router, t])

  return null
}
