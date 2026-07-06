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
      return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    case 'stale':
    case 'degraded':
      return 'text-amber-800 bg-amber-50 border-amber-200'
    default:
      return 'text-jid-ink/60 bg-jid-beige/50 border-jid-line'
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
    <Card className="border-jid-line bg-white">
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-jid-line bg-jid-beige/20 p-4"
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-jid-ink/45">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-jid-ink">{row.value}</dd>
              {row.detail ? (
                <dd className="mt-0.5 text-xs text-jid-ink/50">{row.detail}</dd>
              ) : null}
              <dd className="mt-2">
                <span
                  className={cn(
                    'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
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
