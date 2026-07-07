import type { MetricThresholdRow } from '@/lib/features/pulse-admin-queries'

/**
 * Section 12 Step 2 — minimum traction before enabling public Platform Pulse.
 * Both total_candidates and total_companies thresholds must be met.
 */
export function hasMinimalTraction(thresholds: MetricThresholdRow[]): boolean {
  const candidates = thresholds.find((row) => row.metric_key === 'total_candidates')
  const companies = thresholds.find((row) => row.metric_key === 'total_companies')
  return Boolean(candidates?.is_met && companies?.is_met)
}
