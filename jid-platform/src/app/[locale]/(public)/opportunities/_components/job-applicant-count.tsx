'use client'

import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatNumber } from '@/lib/utils/format'

type JobApplicantCountProps = {
  jobId: string
  initialCount: number
  locale?: 'ar' | 'en'
}

/** Live applicant_count — refreshes from API periodically. */
export function JobApplicantCount({
  jobId,
  initialCount,
  locale = 'ar',
}: JobApplicantCountProps) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    setCount(initialCount)
  }, [initialCount])

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, { credentials: 'include' })
        if (!response.ok) return
        const body = (await response.json()) as { job?: { applicant_count?: number } }
        if (!cancelled && typeof body.job?.applicant_count === 'number') {
          setCount(body.job.applicant_count)
        }
      } catch {
        // Keep last known count on transient failures.
      }
    }

    const interval = window.setInterval(() => {
      void refresh()
    }, 30_000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [jobId])

  return (
    <p
      className="flex items-center gap-2 font-arabic text-sm text-jid-ink/70"
      aria-live="polite"
      aria-atomic="true"
    >
      <Users className="h-4 w-4 shrink-0 text-jid-olive" aria-hidden />
      <span>{formatNumber(count, locale)} متقدّم على هذه الفرصة</span>
    </p>
  )
}
