import type { PlatformMetricsSnapshot } from '@/lib/pulse/queries'

export type MetricFormat = 'number' | 'percentage'

export type MetricAccentColor = 'olive' | 'gold' | 'default'

export type MetricConfigItem = {
  /** `metric_thresholds.metric_key` */
  thresholdKey: string
  snapshotField: keyof Pick<
    PlatformMetricsSnapshot,
    | 'total_candidates'
    | 'directory_coverage_count'
    | 'verified_profiles_count'
    | 'total_jobs_ever'
    | 'total_mentors'
    | 'total_sessions'
    | 'jid_response_rate_pct'
  >
  /** Optional quiet caption i18n suffix (pulse.metrics.{thresholdKey}.caption). */
  captionKey?: boolean
  format: MetricFormat
  accentColor?: MetricAccentColor
}

/** Section 6.6 — pulse metric cards (threshold-gated; never show sub-threshold zeros). */
export const METRICS_CONFIG: readonly MetricConfigItem[] = [
  {
    thresholdKey: 'total_candidates',
    snapshotField: 'total_candidates',
    format: 'number',
  },
  {
    thresholdKey: 'directory_coverage',
    snapshotField: 'directory_coverage_count',
    captionKey: true,
    format: 'number',
    accentColor: 'olive',
  },
  {
    thresholdKey: 'verified_profiles',
    snapshotField: 'verified_profiles_count',
    captionKey: true,
    format: 'number',
    accentColor: 'gold',
  },
  {
    thresholdKey: 'total_jobs',
    snapshotField: 'total_jobs_ever',
    format: 'number',
  },
  {
    thresholdKey: 'total_mentors',
    snapshotField: 'total_mentors',
    format: 'number',
  },
  {
    thresholdKey: 'total_sessions',
    snapshotField: 'total_sessions',
    format: 'number',
  },
  {
    thresholdKey: 'response_rate',
    snapshotField: 'jid_response_rate_pct',
    format: 'percentage',
  },
] as const

export type VisiblePulseMetric = MetricConfigItem & {
  value: number
  labelAr: string
  captionAr?: string
}

export function buildVisibleMetrics(
  snapshot: PlatformMetricsSnapshot,
  thresholds: Array<{ metric_key: string; is_displayed: boolean }>,
  labels: Record<string, { label: string; caption?: string }>,
): VisiblePulseMetric[] {
  const displayed = new Set(
    thresholds.filter((row) => row.is_displayed).map((row) => row.metric_key),
  )

  return METRICS_CONFIG.filter((config) => displayed.has(config.thresholdKey)).map((config) => {
    const copy = labels[config.thresholdKey]
    return {
      ...config,
      labelAr: copy?.label ?? config.thresholdKey,
      captionAr: copy?.caption,
      value: Number(snapshot[config.snapshotField] ?? 0),
    }
  })
}
