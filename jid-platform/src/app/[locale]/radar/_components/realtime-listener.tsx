'use client'

import { useRealtimeApplications } from '@/lib/hooks/use-realtime-applications'
import { useRealtimeMeetings } from '@/lib/hooks/use-realtime-meetings'
import { useFeatureFlag } from '@/lib/feature-flags/use-feature-flag'
import { FLAG_KEYS } from '@/lib/feature-flags/keys'

type RadarRealtimeListenerProps = {
  userId: string
}

/**
 * Conditionally subscribes to Radar Postgres changes when realtime updates are enabled.
 */
export function RadarRealtimeListener({ userId }: RadarRealtimeListenerProps) {
  const { isLoading, isEnabled } = useFeatureFlag(FLAG_KEYS.RADAR_REALTIME_UPDATES)

  const realtimeActive = !isLoading && isEnabled

  useRealtimeApplications(realtimeActive ? userId : null)
  useRealtimeMeetings(realtimeActive ? userId : null)

  return null
}
