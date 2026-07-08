import dynamic from 'next/dynamic'
import type { SysDashboardMetrics } from '@/lib/governance/schemas'

const MetricsSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="h-32 animate-pulse rounded-xl border border-border bg-muted/40" />
    ))}
  </div>
)

const DashboardMetricsClient = dynamic(
  () => import('./dashboard-metrics').then((mod) => ({ default: mod.DashboardMetrics })),
  { loading: () => <MetricsSkeleton /> },
)

type DashboardMetricsLazyProps = {
  metrics: SysDashboardMetrics
}

/** Part 8 — lazy-loaded super-admin metric cards (lucide + card chrome). */
export function DashboardMetricsLazy({ metrics }: DashboardMetricsLazyProps) {
  return <DashboardMetricsClient metrics={metrics} />
}
