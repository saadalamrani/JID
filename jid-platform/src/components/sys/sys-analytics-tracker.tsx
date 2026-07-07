'use client'

import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics/track'
import type { SysAnalyticsEvent } from '@/lib/analytics/sys-events'

type SysAnalyticsTrackerProps = {
  event: SysAnalyticsEvent
  properties?: Record<string, unknown>
}

/** Fires a Section 16 sys.* analytics event once on mount. */
export function SysAnalyticsTracker({ event, properties }: SysAnalyticsTrackerProps) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    track(event, properties)
  }, [event, properties])

  return null
}
