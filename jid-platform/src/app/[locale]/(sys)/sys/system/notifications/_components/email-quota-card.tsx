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
    return { bar: 'bg-red-500', text: 'text-red-700' }
  }
  if (percent >= 85) {
    return { bar: 'bg-amber-500', text: 'text-amber-700' }
  }
  return { bar: 'bg-jid-olive', text: 'text-jid-olive' }
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
    <div className="space-y-2 rounded-lg border border-jid-line bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-jid-ink">{label}</p>
        <p className={cn('text-sm font-medium tabular-nums', tone.text)}>{percent}%</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-jid-beige/80">
        <div className={cn('h-full rounded-full transition-all', tone.bar)} style={{ width: `${percent}%` }} />
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-jid-ink/60">
        <span>
          {usedLabel}: <span className="tabular-nums font-medium text-jid-ink">{used}</span>
        </span>
        <span>
          {limitLabel}: <span className="tabular-nums font-medium text-jid-ink">{limit}</span>
        </span>
        <span>
          {remainingLabel}: <span className="tabular-nums font-medium text-jid-ink">{remaining}</span>
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
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
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
