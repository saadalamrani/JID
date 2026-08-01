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

/** Spec 08-B — flat KPI card; hint must be supplied via i18n (no hardcoded AR footer). */
export function KpiCard({ label, value, hint, icon, trend }: KpiCardProps) {
  return (
    <article className="rounded-2xl border border-accent/40 bg-background/50 p-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground/75">{label}</p>
        {icon ? <div className="text-primary">{icon}</div> : null}
      </header>

      <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>

      <footer className="mt-2 flex items-center justify-between gap-2">
        {hint ? <p className="text-xs text-foreground/60">{hint}</p> : <span />}
        {trend ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              trend.positive
                ? 'bg-primary/10 text-primary'
                : 'bg-accent/20 text-foreground'
            }`}
          >
            {trend.value}
          </span>
        ) : null}
      </footer>
    </article>
  )
}
