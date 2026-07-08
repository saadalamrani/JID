'use client'

import type { EmailQuotaStatus } from '@/lib/sys/notifications-health-queries'
import { cn } from '@/lib/utils'

type EmailQuotaCardProps = {
  quota: EmailQuotaStatus
  circuitBanner: string
  dailyLabel: string
  monthlyLabel: string
  usedLabel: string
  limitLabel: string
  remainingLabel: string
}

function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0
  return Math.min(Math.round((used / limit) * 100), 100)
}

function meterTone(percent: number): { bar: string; text: string } {
  if (percent >= 100) {
    return { bar: 'bg-destructive/100', text: 'text-destructive' }
  }
  if (percent >= 85) {
    return { bar: 'bg-sem-warning', text: 'text-sem-warning' }
  }
  return { bar: 'bg-primary', text: 'text-primary' }
}

function QuotaMeter({
  label,
  used,
  limit,
  remaining,
  usedLabel,
  limitLabel,
  remainingLabel,
}: {
  label: string
  used: number
  limit: number
  remaining: number
  usedLabel: string
  limitLabel: string
  remainingLabel: string
}) {
  const percent = usagePercent(used, limit)
  const tone = meterTone(percent)

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className={cn('text-sm font-medium tabular-nums', tone.text)}>{percent}%</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', tone.bar)} style={{ width: `${percent}%` }} />
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {usedLabel}: <span className="tabular-nums font-medium text-foreground">{used}</span>
        </span>
        <span>
          {limitLabel}: <span className="tabular-nums font-medium text-foreground">{limit}</span>
        </span>
        <span>
          {remainingLabel}: <span className="tabular-nums font-medium text-foreground">{remaining}</span>
        </span>
      </div>
    </div>
  )
}

export function EmailQuotaCard({
  quota,
  circuitBanner,
  dailyLabel,
  monthlyLabel,
  usedLabel,
  limitLabel,
  remainingLabel,
}: EmailQuotaCardProps) {
  return (
    <section className="space-y-4">
      {quota.circuit_open ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          {circuitBanner}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <QuotaMeter
          label={dailyLabel}
          used={quota.sent_today}
          limit={quota.daily_limit}
          remaining={quota.remaining}
          usedLabel={usedLabel}
          limitLabel={limitLabel}
          remainingLabel={remainingLabel}
        />
        <QuotaMeter
          label={monthlyLabel}
          used={quota.sent_this_month}
          limit={quota.monthly_limit}
          remaining={quota.monthly_remaining}
          usedLabel={usedLabel}
          limitLabel={limitLabel}
          remainingLabel={remainingLabel}
        />
      </div>
    </section>
  )
}
