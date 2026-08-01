'use client'

import { useTranslations } from 'next-intl'

type StatusBreakdownBarsProps = {
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

/** Spec 08-B — status breakdown bars with i18n empty/labels (no hardcoded AR-only copy). */
export function StatusBreakdownBars({ data }: StatusBreakdownBarsProps) {
  const t = useTranslations('university.dashboard.statusBars')
  const entries = Object.entries(parseJsonMap(data)).filter(([, value]) => Number(value) > 0)
  const total = entries.reduce((sum, [, value]) => sum + Number(value), 0)

  if (!entries.length || total === 0) {
    return <p className="text-sm text-foreground/60">{t('empty')}</p>
  }

  return (
    <div className="space-y-3">
      {entries.map(([status, raw]) => {
        const value = Number(raw)
        const pct = Math.max(2, Math.round((value / total) * 100))
        const knownLabels = [
          'current_student',
          'expected_graduate',
          'graduate',
          'alumni',
          'other',
          'unspecified',
        ] as const
        const label = (knownLabels as readonly string[]).includes(status)
          ? t(`labels.${status as (typeof knownLabels)[number]}`)
          : status
        return (
          <div key={status} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">{label}</span>
              <span className="font-medium tabular-nums text-foreground/70">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
