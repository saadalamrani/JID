'use client'

import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics/track'

/** Section 14 — fire pulse_viewed once per page mount. */
export function PulseViewedTracker() {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    track('pulse_viewed')
  }, [])

  return null
}
