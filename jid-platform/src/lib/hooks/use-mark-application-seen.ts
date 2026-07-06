'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { userApplicationsQueryKey } from '@/lib/applications/client'
import { createClient } from '@/lib/supabase/client'
import { track } from '@/lib/analytics/track'
import type { UserApplicationsResult } from '@/types/application'

async function patchLastSeenAt(applicationId: string): Promise<string> {
  const now = new Date().toISOString()
  const supabase = createClient()
  const { error } = await supabase
    .from('applications')
    .update({ last_seen_by_user_at: now })
    .eq('id', applicationId)

  if (error) throw new Error(error.message)
  return now
}

function patchApplicationsCacheSeen(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  applicationId: string,
  seenAt: string,
) {
  const queryKey = userApplicationsQueryKey(userId)
  queryClient.setQueryData<UserApplicationsResult>(queryKey, (current) => {
    if (!current) return current
    return {
      ...current,
      applications: current.applications.map((application) =>
        application.id === applicationId
          ? { ...application, last_seen_by_user_at: seenAt }
          : application,
      ),
    }
  })
}

/** Section 7.6 / 14 — mark application seen after card enters viewport (IntersectionObserver). */
export function useMarkApplicationSeen(
  applicationId: string,
  userId: string,
  enabled: boolean,
) {
  const queryClient = useQueryClient()
  const markedRef = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const markAsSeen = useCallback(async () => {
    if (markedRef.current) return
    markedRef.current = true

    const seenAt = new Date().toISOString()
    patchApplicationsCacheSeen(queryClient, userId, applicationId, seenAt)

    try {
      const persistedAt = await patchLastSeenAt(applicationId)
      patchApplicationsCacheSeen(queryClient, userId, applicationId, persistedAt)
      track('radar_glow_seen', { application_id: applicationId })
    } catch {
      markedRef.current = false
      void queryClient.invalidateQueries({ queryKey: userApplicationsQueryKey(userId) })
    }
  }, [applicationId, queryClient, userId])

  useEffect(() => {
    markedRef.current = false
  }, [applicationId])

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [])

  const setCardRef = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null

      if (!node || !enabled || markedRef.current) return

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (!entry?.isIntersecting || markedRef.current) return
          void markAsSeen()
        },
        { threshold: 0.35, rootMargin: '0px 0px -8% 0px' },
      )

      observer.observe(node)
      observerRef.current = observer
    },
    [enabled, markAsSeen],
  )

  return { setCardRef, markAsSeen }
}
