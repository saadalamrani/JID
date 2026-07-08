'use client'

import { Activity, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { StaffPersonalMetrics } from '@/lib/staff/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type PersonalMetricsProps = {
  metrics: StaffPersonalMetrics
}

type MetricDefinition = {
  key: 'actions_today' | 'claims_approved_today' | 'claims_rejected_today' | 'avg_review_hours_7d'
  icon: typeof Activity
  format?: (value: number) => string
}

/** Section 6.2 — four personal KPI cards for the logged-in staff member. */
const METRIC_DEFINITIONS: MetricDefinition[] = [
  { key: 'actions_today', icon: Activity },
  { key: 'claims_approved_today', icon: CheckCircle2 },
  { key: 'claims_rejected_today', icon: XCircle },
  {
    key: 'avg_review_hours_7d',
    icon: Clock,
    format: (value) => value.toFixed(1),
  },
]

export function PersonalMetrics({ metrics }: PersonalMetricsProps) {
  const t = useTranslations('staff.dashboard.personalMetrics')

  return (
    <section aria-label={t('sectionLabel')}>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">{t('sectionLabel')}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRIC_DEFINITIONS.map(({ key, icon: Icon, format }) => {
          const raw = metrics[key]
          const display = format ? format(raw) : raw.toLocaleString()

          return (
            <Card key={key} className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t(`cards.${key}.label`)}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary/70" aria-hidden />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums text-foreground">{display}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t(`cards.${key}.hint`)}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
