'use client'

import { useEffect, useRef } from 'react'
import { trackProfileView } from '@/lib/profile/view-tracker'

type ProfileViewTrackerProps = {
  profileId: string
  companyId: string
}

/**
 * Client-mounted tracker — runs after paint, never blocks SSR (Section 13).
 */
export function ProfileViewTracker({ profileId, companyId }: ProfileViewTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    trackProfileView(profileId, companyId)
  }, [profileId, companyId])

  return null
}
