import { MetricCard } from '@/app/[locale]/(public)/pulse/_components/metric-card'
import { formatTimeAr } from '@/lib/pulse/format-helpers'
import { METRICS_CONFIG } from '@/lib/pulse/metrics-config'
import { fetchPlatformMetrics, fetchThresholds } from '@/lib/pulse/queries'
import { isDbOfflineError } from '@/lib/supabase/offline-error'
import { getTranslations } from 'next-intl/server'

const METRIC_I18N_KEYS = {
  total_candidates: 'total_candidates',
  directory_coverage: 'directory_coverage',
  verified_profiles: 'verified_profiles',
  total_jobs: 'total_jobs',
  total_mentors: 'total_mentors',
  total_sessions: 'total_sessions',
  response_rate: 'response_rate',
} as const

type MetricI18nKey = keyof typeof METRIC_I18N_KEYS

function metricI18nKey(thresholdKey: string): MetricI18nKey {
  if (thresholdKey in METRIC_I18N_KEYS) {
    return thresholdKey as MetricI18nKey
  }
  return 'total_candidates'
}

/** Section 6.6 — threshold-gated live statistics hub. */
export async function LiveStatisticsHub() {
  try {
    const [snapshot, thresholds, t] = await Promise.all([
      fetchPlatformMetrics(),
      fetchThresholds(),
      getTranslations('pulse.metrics'),
    ])

    if (!snapshot) return null

    const thresholdByKey = new Map(thresholds.map((item) => [item.metric_key, item]))
    const visibleMetrics = METRICS_CONFIG.filter(
      (config) => thresholdByKey.get(config.thresholdKey)?.is_displayed === true,
    ).map((config) => {
      const key = metricI18nKey(config.thresholdKey)
      return {
        ...config,
        labelAr: t(`${key}.label`),
        captionAr: config.captionKey ? t(`${key}.caption`) : undefined,
        value: Number(snapshot[config.snapshotField] ?? 0),
      }
    })

    if (visibleMetrics.length === 0) return null

    const refreshedLabel = formatTimeAr(snapshot.refreshed_at)

    return (
      <section
        className="flex min-h-[280px] flex-col rounded-xl border border-border bg-background/50 p-4 shadow-sm"
        aria-label="إحصائيات المنصة الحية"
      >
        <header className="mb-4 flex items-center justify-between gap-2 border-b border-border pb-3">
          <h2 className="text-sm font-semibold text-foreground">إحصائيات المنصة</h2>
          {refreshedLabel ? (
            <p className="text-[11px] text-foreground/55">
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
              captionAr={metric.captionAr}
              value={metric.value}
              format={metric.format}
              accentColor={metric.accentColor}
            />
          ))}
        </div>
      </section>
    )
  } catch (error) {
    if (isDbOfflineError(error)) {
      return null
    }
    throw error
  }
}
