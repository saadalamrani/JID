import type { PlatformMetricsSnapshot } from '@/lib/pulse/queries'

export type MetricFormat = 'number' | 'percentage'

export type MetricConfigItem = {
  /** `metric_thresholds.metric_key` */
  thresholdKey: string
  snapshotField: keyof Pick<
    PlatformMetricsSnapshot,
    | 'total_candidates'
    | 'total_companies'
    | 'total_jobs_ever'
    | 'total_mentors'
    | 'total_sessions'
    | 'jid_response_rate_pct'
  >
  labelAr: string
  format: MetricFormat
}

/** Section 6.6 — pulse metric cards (threshold-gated; never show sub-threshold zeros). */
export const METRICS_CONFIG: readonly MetricConfigItem[] = [
  {
    thresholdKey: 'total_candidates',
    snapshotField: 'total_candidates',
    labelAr: 'إجمالي المرشحين',
    format: 'number',
  },
  {
    thresholdKey: 'total_companies',
    snapshotField: 'total_companies',
    labelAr: 'إجمالي الشركات',
    format: 'number',
  },
  {
    thresholdKey: 'total_jobs',
    snapshotField: 'total_jobs_ever',
    labelAr: 'إجمالي الوظائف',
    format: 'number',
  },
  {
    thresholdKey: 'total_mentors',
    snapshotField: 'total_mentors',
    labelAr: 'إجمالي المرشدين',
    format: 'number',
  },
  {
    thresholdKey: 'total_sessions',
    snapshotField: 'total_sessions',
    labelAr: 'إجمالي الجلسات',
    format: 'number',
  },
  {
    thresholdKey: 'response_rate',
    snapshotField: 'jid_response_rate_pct',
    labelAr: 'معدل الاستجابة في جِد',
    format: 'percentage',
  },
] as const

export type VisiblePulseMetric = MetricConfigItem & {
  value: number
}

export function buildVisibleMetrics(
  snapshot: PlatformMetricsSnapshot,
  thresholds: Array<{ metric_key: string; is_displayed: boolean }>,
): VisiblePulseMetric[] {
  const displayed = new Set(
    thresholds.filter((row) => row.is_displayed).map((row) => row.metric_key),
  )

  return METRICS_CONFIG.filter((config) => displayed.has(config.thresholdKey)).map((config) => ({
    ...config,
    value: Number(snapshot[config.snapshotField] ?? 0),
  }))
}
