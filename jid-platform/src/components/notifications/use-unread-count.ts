'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

async function fetchUnreadCount(userId: string): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null)
    .is('archived_at', null)

  if (error) {
    throw error
  }

  return count ?? 0
}

/**
 * Live unread notification count — initial fetch + Realtime `*` on `notifications`.
 */
export function useUnreadCount(userId: string | null | undefined) {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(Boolean(userId))

  const refresh = useCallback(async () => {
    if (!userId) {
      setCount(0)
      setIsLoading(false)
      return
    }

    try {
      const next = await fetchUnreadCount(userId)
      setCount(next)
    } catch {
      setCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setIsLoading(Boolean(userId))
    void refresh()
  }, [refresh, userId])

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`notifications-unread-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          void refresh()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refresh, userId])

  return { count, isLoading, refresh }
}
