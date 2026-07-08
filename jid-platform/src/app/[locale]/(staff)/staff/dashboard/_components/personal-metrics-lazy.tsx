import dynamic from 'next/dynamic'
import type { StaffPersonalMetrics } from '@/lib/staff/types'

const MetricsSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="h-32 animate-pulse rounded-xl border border-border bg-muted/40" />
    ))}
  </div>
)

const PersonalMetricsClient = dynamic(
  () => import('./personal-metrics').then((mod) => ({ default: mod.PersonalMetrics })),
  { loading: () => <MetricsSkeleton /> },
)

type PersonalMetricsLazyProps = {
  metrics: StaffPersonalMetrics
}

/** Part 8 — lazy-loaded staff portal analytics KPI cards. */
export function PersonalMetricsLazy({ metrics }: PersonalMetricsLazyProps) {
  return <PersonalMetricsClient metrics={metrics} />
}
