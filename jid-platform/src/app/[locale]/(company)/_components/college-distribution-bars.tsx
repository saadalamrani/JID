'use client'

import { useTranslations } from 'next-intl'

type CollegeDistributionBarsProps = {
  data: Record<string, number> | string | null | undefined
}

function parseJsonMap(input: Record<string, number> | string | null | undefined): Record<string, number> {
  if (!input) return {}
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input) as Record<string, number>
      return parsed ?? {}
    } catch {
      return {}
    }
  }
  return input
}

/** Spec 08-B — college distribution bars with i18n empty copy. */
export function CollegeDistributionBars({ data }: CollegeDistributionBarsProps) {
  const t = useTranslations('university.dashboard.collegeBars')
  const entries = Object.entries(parseJsonMap(data))
    .map(([name, value]) => [name, Number(value)] as const)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])

  const total = entries.reduce((sum, [, value]) => sum + value, 0)
  const max = entries[0]?.[1] ?? 0

  if (!entries.length || total === 0) {
    return <p className="text-sm text-foreground/60">{t('empty')}</p>
  }

  return (
    <div className="space-y-3">
      {entries.map(([name, value]) => {
        const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0
        const ratio = Math.round((value / total) * 100)
        return (
          <div key={name} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-foreground">{name}</span>
              <span className="shrink-0 font-medium tabular-nums text-foreground/70">
                {value} ({ratio}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
