'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export type OwnerStatsData = {
  companiesViewed: number
  activeApplications: number
  completionPct: number
}

/**
 * Internal-only stats panel. Parent must pass `stats` only when `showStats` gate passed.
 * This component does not accept a visibility flag — callers use `resolveOwnerStats` first.
 */
export function OwnerStatsGrid({ stats }: { stats: OwnerStatsData }) {
  const t = useTranslations('profile.components')

  const items = [
    { label: t('statsCompaniesViewed'), value: stats.companiesViewed },
    { label: t('statsActiveApplications'), value: stats.activeApplications },
    { label: t('statsCompletion'), value: `${stats.completionPct}%` },
  ]

  return (
    <div
      className="grid grid-cols-3 gap-3 rounded-xl border border-jid-line bg-jid-beige/50 p-4"
      data-owner-stats="true"
    >
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <p className={cn('text-lg font-semibold text-jid-olive')}>{item.value}</p>
          <p className="mt-1 text-xs text-jid-ink/60">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * Prop-driven gate for owner stats (Section 13).
 * Returns null unless `showStats === true` AND stats payload is present.
 * Non-owner parents must pass `showStats={false}` — stats never render.
 */
export function resolveOwnerStats(
  showStats: boolean,
  stats: OwnerStatsData | undefined,
): OwnerStatsData | null {
  if (showStats !== true) return null
  if (!stats) return null
  return stats
}
