'use client'

import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics/track'
import type { StaffAnalyticsEvent } from '@/lib/analytics/staff-events'

type StaffAnalyticsTrackerProps = {
  event: StaffAnalyticsEvent
  properties?: Record<string, unknown>
}

/** Fires a Section 17 staff.* analytics event once on mount. */
export function StaffAnalyticsTracker({ event, properties }: StaffAnalyticsTrackerProps) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    track(event, properties)
  }, [event, properties])

  return null
}
