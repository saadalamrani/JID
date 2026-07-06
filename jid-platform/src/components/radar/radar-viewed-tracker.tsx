'use client'

import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics/track'

/** Section 15 — fire radar_viewed once per page mount. */
export function RadarViewedTracker() {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    track('radar_viewed')
  }, [])

  return null
}
