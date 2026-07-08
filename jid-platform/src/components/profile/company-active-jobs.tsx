'use client'

import { Briefcase } from 'lucide-react'
import { useTranslations } from 'next-intl'

type CompanyActiveJobsProps = {
  companyId: string
  activeJobsCount: number
  totalPosted12mo: number
}

/**
 * Placeholder — full job listing ships with the Job Board module (Section 12 Step 10).
 */
export function CompanyActiveJobs({
  companyId,
  activeJobsCount,
  totalPosted12mo,
}: CompanyActiveJobsProps) {
  const t = useTranslations('profile.company.public')

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm" data-company-id={companyId}>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">{t('activeJobsTitle')}</h2>
      <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-background/20 p-4">
        <Briefcase className="h-6 w-6 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-sm font-medium text-foreground">
            {t('activeJobsPreview', { count: activeJobsCount })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('activeJobsPostedHint', { count: totalPosted12mo })}
          </p>
          <p className="mt-2 text-xs text-foreground/40">
            {/* TODO: Job Board — list open roles for company {companyId} */}
            {t('activeJobsTodo')}
          </p>
        </div>
      </div>
    </section>
  )
}
