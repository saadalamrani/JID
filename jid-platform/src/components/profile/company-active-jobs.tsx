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
    <section className="rounded-xl border border-jid-line bg-white p-5 shadow-sm" data-company-id={companyId}>
      <h2 className="mb-3 text-sm font-medium text-jid-ink/70">{t('activeJobsTitle')}</h2>
      <div className="flex items-start gap-3 rounded-lg border border-dashed border-jid-line bg-jid-beige/20 p-4">
        <Briefcase className="h-6 w-6 shrink-0 text-jid-olive" aria-hidden />
        <div>
          <p className="text-sm font-medium text-jid-ink">
            {t('activeJobsPreview', { count: activeJobsCount })}
          </p>
          <p className="mt-1 text-xs text-jid-ink/60">
            {t('activeJobsPostedHint', { count: totalPosted12mo })}
          </p>
          <p className="mt-2 text-xs text-jid-ink/40">
            {/* TODO: Job Board — list open roles for company {companyId} */}
            {t('activeJobsTodo')}
          </p>
        </div>
      </div>
    </section>
  )
}
