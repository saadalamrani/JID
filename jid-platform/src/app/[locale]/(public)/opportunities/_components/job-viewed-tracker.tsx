'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics/track'

type JobViewedTrackerProps = {
  jobId: string
  companyId: string
}

export function JobViewedTracker({ jobId, companyId }: JobViewedTrackerProps) {
  useEffect(() => {
    track('job_viewed', { job_id: jobId, company_id: companyId })
  }, [jobId, companyId])

  return null
}
