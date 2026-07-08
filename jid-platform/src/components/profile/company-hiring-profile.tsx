'use client'

import { Briefcase, Clock, Percent } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { CompanyProfileRecord } from '@/lib/profile/types'

type CompanyHiringProfileProps = {
  company: Pick<
    CompanyProfileRecord,
    'avg_response_days' | 'response_rate_pct' | 'total_jobs_posted_12mo'
  >
}

export function CompanyHiringProfile({ company }: CompanyHiringProfileProps) {
  const t = useTranslations('profile.company.public')

  const metrics = [
    {
      key: 'responseDays',
      icon: Clock,
      label: t('avgResponseDaysLabel'),
      value:
        company.avg_response_days != null
          ? t('avgResponseDaysValue', { days: company.avg_response_days })
          : t('metricUnavailable'),
    },
    {
      key: 'responseRate',
      icon: Percent,
      label: t('responseRateLabel'),
      value:
        company.response_rate_pct != null
          ? t('responseRateValue', { pct: company.response_rate_pct })
          : t('metricUnavailable'),
    },
    {
      key: 'jobsPosted',
      icon: Briefcase,
      label: t('jobsPosted12moLabel'),
      value: t('jobsPosted12moValue', { count: company.total_jobs_posted_12mo }),
    },
  ]

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">{t('hiringProfileTitle')}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map(({ key, icon: Icon, label, value }) => (
          <div key={key} className="rounded-lg border border-border bg-background/30 p-4">
            <Icon className="h-5 w-5 text-primary" aria-hidden />
            <p className="mt-2 text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
