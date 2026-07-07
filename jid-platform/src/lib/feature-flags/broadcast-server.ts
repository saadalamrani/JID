import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

const BROADCAST_CHANNEL = 'feature-flags-broadcast'
const BROADCAST_EVENT = 'flag-toggled'
const BROADCAST_TIMEOUT_MS = 5_000

export type FeatureFlagBroadcastPayload = {
  key: string
  isEnabled: boolean
}

/** Best-effort Realtime broadcast so connected clients invalidate TanStack Query caches. */
export async function broadcastFeatureFlagToggle(
  payload: FeatureFlagBroadcastPayload,
): Promise<void> {
  const supabase = createAdminClient()
  const channel = supabase.channel(BROADCAST_CHANNEL, {
    config: { broadcast: { self: false } },
  })

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      void supabase.removeChannel(channel)
      reject(new Error('Feature flag broadcast timed out'))
    }, BROADCAST_TIMEOUT_MS)

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const result = await channel.send({
          type: 'broadcast',
          event: BROADCAST_EVENT,
          payload,
        })

        clearTimeout(timeout)
        void supabase.removeChannel(channel)

        if (result === 'error') {
          reject(new Error('Feature flag broadcast send failed'))
          return
        }

        resolve()
        return
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timeout)
        void supabase.removeChannel(channel)
        reject(new Error(`Feature flag broadcast channel ${status}`))
      }
    })
  })
}
