'use client'

import { useEffect, useState } from 'react'
import { AutoReplyDisclaimer } from '@/components/communication/auto-reply-disclaimer'
import { fetchJobAutoReplyEnabled } from '@/lib/communication/client'

type JobAutoReplyDisclaimerProps = {
  jobId: string
  className?: string
}

/** Shows spec-locked disclaimer when job_auto_reply_enabled is false. */
export function JobAutoReplyDisclaimer({ jobId, className }: JobAutoReplyDisclaimerProps) {
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    void fetchJobAutoReplyEnabled(jobId)
      .then((value) => {
        setEnabled(value)
        if (!value && process.env.NODE_ENV === 'development') {
          console.debug('[analytics]', 'disclaimer_impression', { job_id: jobId })
        }
      })
      .catch(() => setEnabled(true))
  }, [jobId])

  if (enabled !== false) return null

  return <AutoReplyDisclaimer className={className} />
}
