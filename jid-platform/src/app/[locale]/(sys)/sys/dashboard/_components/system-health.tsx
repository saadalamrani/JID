'use client'

import { useTranslations } from 'next-intl'
import type { SystemHealthSnapshot } from '@/types/sys-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type SystemHealthProps = {
  health: SystemHealthSnapshot
}

function statusClass(status: string): string {
  switch (status) {
    case 'healthy':
      return 'text-primary bg-primary/10 border-primary/30'
    case 'stale':
    case 'degraded':
      return 'text-sem-warning bg-sem-warning/10 border-sem-warning/30'
    default:
      return 'text-muted-foreground bg-background/50 border-border'
  }
}

/** Section 6 — cron status, MV refresh timestamp, DB latency / pool proxy. */
export function SystemHealth({ health }: SystemHealthProps) {
  const t = useTranslations('sys.dashboard.systemHealth')

  const rows = [
    {
      label: t('cronJob'),
      value: health.cron_job_name,
      detail: health.cron_schedule,
      status: health.cron_status,
      statusLabel: t(`status.${health.cron_status}`),
    },
    {
      label: t('mvRefresh'),
      value: health.last_mv_refresh
        ? new Date(health.last_mv_refresh).toLocaleString()
        : t('unknown'),
      detail: null,
      status: health.cron_status,
      statusLabel: t(`status.${health.cron_status}`),
    },
    {
      label: t('dbLatency'),
      value:
        health.db_latency_ms !== null
          ? t('latencyValue', { ms: health.db_latency_ms })
          : t('unknown'),
      detail: null,
      status: health.connection_pool,
      statusLabel: t(`pool.${health.connection_pool}`),
    },
    {
      label: t('connectionPool'),
      value: t(`pool.${health.connection_pool}`),
      detail:
        health.db_latency_ms !== null
          ? t('poolHint', { ms: health.db_latency_ms })
          : t('poolUnavailable'),
      status: health.connection_pool,
      statusLabel: t(`pool.${health.connection_pool}`),
    },
  ] as const

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-border bg-background/20 p-4"
            >
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{row.value}</dd>
              {row.detail ? (
                <dd className="mt-0.5 text-xs text-muted-foreground">{row.detail}</dd>
              ) : null}
              <dd className="mt-2">
                <span
                  className={cn(
                    'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase',
                    statusClass(row.status),
                  )}
                >
                  {row.statusLabel}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
