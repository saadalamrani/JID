'use client'

import { Calendar, CheckCircle2, Users } from 'lucide-react'
import type { JobTriageHeader } from '@/types/application'
import { formatNumber } from '@/lib/utils/format'

type JobTriageHeaderProps = {
  job: JobTriageHeader
}

/** Section 5.1 — job summary with applicant/accepted counts and days until close. */
export function JobTriageHeaderBar({ job }: JobTriageHeaderProps) {
  const title = job.title_ar || job.title_en || '—'

  return (
    <header className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <h1 className="font-arabic text-xl font-semibold text-foreground">{title}</h1>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg bg-background/50 px-4 py-3">
          <Users className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <dt className="font-arabic text-xs text-foreground/60">المتقدمون</dt>
            <dd className="font-arabic text-lg font-semibold text-foreground">
              {formatNumber(job.applicantCount, 'ar')}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-background/50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" aria-hidden />
          <div>
            <dt className="font-arabic text-xs text-foreground/60">المقبولون</dt>
            <dd className="font-arabic text-lg font-semibold text-foreground">
              {formatNumber(job.acceptedCount, 'ar')}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-background/50 px-4 py-3">
          <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <dt className="font-arabic text-xs text-foreground/60">أيام حتى الإغلاق</dt>
            <dd className="font-arabic text-lg font-semibold text-foreground">
              {formatNumber(job.daysUntilClose, 'ar')}
            </dd>
          </div>
        </div>
      </dl>
    </header>
  )
}
