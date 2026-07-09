'use client'

import { useEffect, useState } from 'react'
import { COMM_KIND_LABELS_AR, type CommKind } from '@/lib/constants/communication'
import { fetchApplicationCommLogs } from '@/lib/communication/client'
import { cn } from '@/lib/utils'

type CommReceiptLineProps = {
  applicationId: string
  className?: string
}

/** Radar transparency line — auto-reply receipt (Prompt 4). */
export function CommReceiptLine({ applicationId, className }: CommReceiptLineProps) {
  const [latest, setLatest] = useState<{ kind: CommKind; sentAt: string } | null>(null)

  useEffect(() => {
    void fetchApplicationCommLogs(applicationId)
      .then((rows) => {
        const first = rows[0]
        if (first) setLatest({ kind: first.kind, sentAt: first.sentAt })
      })
      .catch(() => {
        /* non-blocking */
      })
  }, [applicationId])

  if (!latest) return null

  const dateLabel = new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(latest.sentAt))

  return (
    <p className={cn('font-arabic text-xs text-muted-foreground', className)}>
      وصلك رد آلي: {COMM_KIND_LABELS_AR[latest.kind]} — {dateLabel}
    </p>
  )
}
