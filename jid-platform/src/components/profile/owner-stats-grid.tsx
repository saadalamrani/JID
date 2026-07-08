'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export type OwnerStatsData = {
  totalViews: number
  distinctCompanies30d: number
  completionPct: number
}

/**
 * Internal-only stats panel. Parent must pass `stats` only when `showStats` gate passed.
 */
export function OwnerStatsGrid({ stats }: { stats: OwnerStatsData }) {
  const t = useTranslations('profile.components')

  const items = [
    { label: t('statsTotalViews'), value: stats.totalViews },
    { label: t('statsDistinctCompanies30d'), value: stats.distinctCompanies30d },
    { label: t('statsCompletion'), value: `${stats.completionPct}%` },
  ]

  return (
    <div
      className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-background/50 p-4"
      data-owner-stats="true"
    >
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <p className={cn('text-lg font-semibold text-primary')}>{item.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

export function resolveOwnerStats(
  showStats: boolean,
  stats: OwnerStatsData | undefined,
): OwnerStatsData | null {
  if (showStats !== true) return null
  if (!stats) return null
  return stats
}
