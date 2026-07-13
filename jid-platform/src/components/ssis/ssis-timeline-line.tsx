'use client'

import { useEffect, useState } from 'react'
import { fetchApplicationSsisTimeline } from '@/lib/ssis/client'
import { SSIS_RECOMMENDATION_LABELS_AR } from '@/lib/ssis/constants'
import type { SsisTimelineEntry } from '@/lib/ssis/types'
import { cn } from '@/lib/utils'

type SsisTimelineLineProps = {
  applicationId: string
  className?: string
}

const KIND_LABELS: Record<SsisTimelineEntry['kind'], string> = {
  invited: 'فحص ذكي',
  started: 'بدء الفحص',
  completed: 'إكمال الفحص',
  evaluated: 'نتيجة الفحص',
  outcome: 'قرار الشركة',
}

/** Radar transparency — SSIS timeline entries on application cards. */
export function SsisTimelineLine({ applicationId, className }: SsisTimelineLineProps) {
  const [entries, setEntries] = useState<SsisTimelineEntry[]>([])

  useEffect(() => {
    void fetchApplicationSsisTimeline(applicationId)
      .then(setEntries)
      .catch(() => {
        /* non-blocking */
      })
  }, [applicationId])

  if (entries.length === 0) return null

  const latest = entries[entries.length - 1]
  if (!latest) return null

  const dateLabel = new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(latest.at))

  const band =
    latest.recommendation != null
      ? SSIS_RECOMMENDATION_LABELS_AR[latest.recommendation]
      : null

  return (
    <p className={cn('font-arabic text-xs text-muted-foreground', className)}>
      {KIND_LABELS[latest.kind]}
      {band ? ` · ${band}` : ''} — {dateLabel}
    </p>
  )
}
