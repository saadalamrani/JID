'use client'

import type { SysDashboardMetrics } from '@/lib/governance/schemas'
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Clock,
  GraduationCap,
  Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type DashboardMetricsProps = {
  metrics: SysDashboardMetrics
}

type MetricDefinition = {
  key: keyof Pick<
    SysDashboardMetrics,
    | 'total_users'
    | 'active_sessions_now'
    | 'pending_claims'
    | 'overdue_claims'
    | 'audit_events_24h'
    | 'pending_mentor_applications'
  >
  icon: typeof Users
  accent?: 'default' | 'warning' | 'danger'
}

/** Section 6.2 — six metric cards from mv_sys_dashboard_metrics singleton row. */
const METRIC_DEFINITIONS: MetricDefinition[] = [
  { key: 'total_users', icon: Users },
  { key: 'active_sessions_now', icon: Activity },
  { key: 'pending_claims', icon: ClipboardList },
  { key: 'overdue_claims', icon: AlertTriangle, accent: 'danger' },
  { key: 'audit_events_24h', icon: Clock },
  { key: 'pending_mentor_applications', icon: GraduationCap, accent: 'warning' },
]

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const t = useTranslations('sys.dashboard.metrics')

  return (
    <section aria-label={t('sectionLabel')}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-sm font-medium text-jid-ink/70">{t('sectionLabel')}</h2>
        <p className="text-xs text-jid-ink/45">
          {t('lastRefreshed', {
            time: new Date(metrics.refreshed_at).toLocaleString(),
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {METRIC_DEFINITIONS.map(({ key, icon: Icon, accent = 'default' }) => {
          const value = metrics[key]
          const isHighlight = accent === 'danger' && value > 0

          return (
            <Card
              key={key}
              className={cn(
                'border-jid-line bg-white',
                isHighlight && 'border-red-200 bg-red-50/40',
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-jid-ink/70">
                  {t(`cards.${key}.label`)}
                </CardTitle>
                <Icon
                  className={cn(
                    'h-4 w-4',
                    accent === 'danger' && value > 0
                      ? 'text-red-600'
                      : accent === 'warning' && value > 0
                        ? 'text-amber-600'
                        : 'text-jid-olive/70',
                  )}
                  aria-hidden
                />
              </CardHeader>
              <CardContent>
                <p
                  className={cn(
                    'text-3xl font-semibold tabular-nums text-jid-ink',
                    isHighlight && 'text-red-700',
                  )}
                >
                  {value.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-jid-ink/50">{t(`cards.${key}.hint`)}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
