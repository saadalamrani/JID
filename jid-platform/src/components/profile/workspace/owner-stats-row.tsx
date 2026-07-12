'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { OwnerStatsSnapshot } from '@/lib/profile/individual-projection-types'
import { formatRelativeTime } from '@/lib/utils/format-relative-time'

type OwnerStatsRowProps = {
  stats: OwnerStatsSnapshot
  locale: 'ar' | 'en'
}

type StatItem = { key: string; value: string | number; label: string }

export function OwnerStatsRow({ stats, locale }: OwnerStatsRowProps) {
  const t = useTranslations('profile.workspace.ownerStats')

  const items: StatItem[] = [
    {
      key: 'activeApplications',
      value: stats.activeApplications,
      label: t('activeApplications'),
    },
    {
      key: 'interviewCount',
      value: stats.interviewCount,
      label: t('interviewCount'),
    },
    {
      key: 'completionPct',
      value: `${stats.completionPct}%`,
      label: t('completionPct'),
    },
    {
      key: 'projectCount',
      value: stats.projectCount,
      label: t('projectCount'),
    },
  ]

  if (stats.radarLastUpdated) {
    items.splice(2, 0, {
      key: 'radarLastUpdated',
      value: formatRelativeTime(stats.radarLastUpdated, locale),
      label: t('radarLastUpdated'),
    })
  }

  if (stats.proofCount != null) {
    items.push({
      key: 'proofCount',
      value: stats.proofCount,
      label: t('proofCount'),
    })
  }

  return (
    <section aria-label={t('ariaLabel')} className="scroll-mt-24">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border border-border bg-card px-3 py-3 shadow-sm"
          >
            <p className="text-lg font-semibold text-foreground">{item.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        <Link href="/radar" className="text-primary hover:underline">
          {t('openRadar')}
        </Link>
      </p>
    </section>
  )
}
