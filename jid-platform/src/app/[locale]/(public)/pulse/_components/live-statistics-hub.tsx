import { MetricCard } from '@/app/[locale]/(public)/pulse/_components/metric-card'
import { formatTimeAr } from '@/lib/pulse/format-helpers'
import { METRICS_CONFIG } from '@/lib/pulse/metrics-config'
import {
  fetchPlatformMetrics,
  fetchThresholds,
} from '@/lib/pulse/queries'

/** Section 6.6 — threshold-gated live statistics hub. */
export async function LiveStatisticsHub() {
  const [snapshot, thresholds] = await Promise.all([
    fetchPlatformMetrics(),
    fetchThresholds(),
  ])

  if (!snapshot) return null

  const thresholdByKey = new Map(thresholds.map((item) => [item.metric_key, item]))
  const visibleMetrics = METRICS_CONFIG.filter(
    (config) => thresholdByKey.get(config.thresholdKey)?.is_displayed === true,
  ).map((config) => ({
    ...config,
    value: Number(snapshot[config.snapshotField] ?? 0),
  }))

  if (visibleMetrics.length === 0) return null

  const refreshedLabel = formatTimeAr(snapshot.refreshed_at)

  return (
    <section
      className="flex min-h-[280px] flex-col rounded-xl border border-jid-line bg-jid-beige/50 p-4 shadow-sm"
      aria-label="إحصائيات المنصة الحية"
    >
      <header className="mb-4 flex items-center justify-between gap-2 border-b border-jid-line/60 pb-3">
        <h2 className="text-sm font-semibold text-jid-ink">إحصائيات المنصة</h2>
        {refreshedLabel ? (
          <p className="text-[11px] text-jid-ink/55">
            آخر تحديث: <time dateTime={snapshot.refreshed_at}>{refreshedLabel}</time>
          </p>
        ) : null}
      </header>

      <div className="grid flex-1 grid-cols-2 gap-3">
        {visibleMetrics.map((metric) => (
          <MetricCard
            key={metric.thresholdKey}
            metricKey={metric.thresholdKey}
            labelAr={metric.labelAr}
            value={metric.value}
            format={metric.format}
          />
        ))}
      </div>
    </section>
  )
}
