import type { ReactNode } from 'react'

type KpiCardProps = {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
  trend?: {
    value: string
    positive?: boolean
  }
}

export function KpiCard({ label, value, hint, icon, trend }: KpiCardProps) {
  return (
    <article className="rounded-2xl border border-jid-gold/40 bg-jid-beige/50 p-4 shadow-sm">
      <header className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-jid-ink/75">{label}</p>
        {icon ? <div className="text-jid-olive">{icon}</div> : null}
      </header>

      <p className="text-2xl font-semibold text-jid-ink">{value}</p>

      <footer className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-jid-ink/60">{hint ?? 'آخر تحديث ضمن دورة التحديث المجدولة.'}</p>
        {trend ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              trend.positive
                ? 'bg-jid-olive/10 text-jid-olive'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {trend.value}
          </span>
        ) : null}
      </footer>
    </article>
  )
}
