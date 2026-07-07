'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { featureFlagQueryKeyPrefix } from '@/lib/feature-flags/query-keys'
import { createClient } from '@/lib/supabase/client'

const BROADCAST_CHANNEL = 'feature-flags-broadcast'
const BROADCAST_EVENT = 'flag-toggled'

type FlagToggledPayload = {
  key?: string
  isEnabled?: boolean
}

/**
 * Listens for super-admin flag toggles and invalidates the matching TanStack Query cache.
 * Mount once inside QueryProvider (root layout).
 */
export function FeatureFlagsRealtimeInvalidator() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(BROADCAST_CHANNEL)
      .on('broadcast', { event: BROADCAST_EVENT }, (message) => {
        const payload = message.payload as FlagToggledPayload | undefined
        const key = payload?.key
        if (typeof key !== 'string' || !key) return

        void queryClient.invalidateQueries({
          queryKey: featureFlagQueryKeyPrefix(key),
        })
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient])

  return null
}
