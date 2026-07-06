'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics/track'

type MentorViewedTrackerProps = {
  mentorId: string
  slug: string | null
}

export function MentorViewedTracker({ mentorId, slug }: MentorViewedTrackerProps) {
  useEffect(() => {
    track('mentor_viewed', { mentor_id: mentorId, slug })
  }, [mentorId, slug])

  return null
}
