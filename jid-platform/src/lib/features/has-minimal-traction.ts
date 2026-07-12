import type { MetricThresholdRow } from '@/lib/features/pulse-admin-queries'

/**
 * Section 12 Step 2 — minimum traction before enabling public Platform Pulse.
 * Both total_candidates and directory_coverage thresholds must be met.
 */
export function hasMinimalTraction(thresholds: MetricThresholdRow[]): boolean {
  const candidates = thresholds.find((row) => row.metric_key === 'total_candidates')
  const directory = thresholds.find((row) => row.metric_key === 'directory_coverage')
  return Boolean(candidates?.is_met && directory?.is_met)
}
