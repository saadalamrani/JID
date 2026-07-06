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
    <header className="rounded-xl border border-jid-line bg-white p-5 shadow-sm">
      <h1 className="font-arabic text-xl font-semibold text-jid-ink">{title}</h1>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg bg-jid-beige/50 px-4 py-3">
          <Users className="h-5 w-5 shrink-0 text-jid-olive" aria-hidden />
          <div>
            <dt className="font-arabic text-xs text-jid-ink/60">المتقدمون</dt>
            <dd className="font-arabic text-lg font-semibold text-jid-ink">
              {formatNumber(job.applicantCount, 'ar')}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-jid-beige/50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-jid-gold" aria-hidden />
          <div>
            <dt className="font-arabic text-xs text-jid-ink/60">المقبولون</dt>
            <dd className="font-arabic text-lg font-semibold text-jid-ink">
              {formatNumber(job.acceptedCount, 'ar')}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-jid-beige/50 px-4 py-3">
          <Calendar className="h-5 w-5 shrink-0 text-jid-ink/50" aria-hidden />
          <div>
            <dt className="font-arabic text-xs text-jid-ink/60">أيام حتى الإغلاق</dt>
            <dd className="font-arabic text-lg font-semibold text-jid-ink">
              {formatNumber(job.daysUntilClose, 'ar')}
            </dd>
          </div>
        </div>
      </dl>
    </header>
  )
}
