'use client'

import { AlertTriangle } from 'lucide-react'
import { FEATURE_FLAG_KEYS } from '@/lib/features/feature-flag-keys'
import { hasMinimalTraction } from '@/lib/features/has-minimal-traction'
import type { MetricThresholdRow, PulseFeatureFlagRow } from '@/lib/features/pulse-admin-queries'
import { FlagRow } from './flag-row'
import { ThresholdRow } from './threshold-row'

type FeatureFlagsPanelProps = {
  flags: PulseFeatureFlagRow[]
  thresholds: MetricThresholdRow[]
}

const SECTION_FLAG_KEYS = [
  FEATURE_FLAG_KEYS.PLATFORM_PULSE_ANNOUNCEMENTS,
  FEATURE_FLAG_KEYS.PLATFORM_PULSE_METRICS,
  FEATURE_FLAG_KEYS.PLATFORM_PULSE_TRENDS,
] as const

export function FeatureFlagsPanel({ flags, thresholds }: FeatureFlagsPanelProps) {
  const flagByKey = new Map(flags.map((flag) => [flag.key, flag]))
  const masterFlag = flagByKey.get(FEATURE_FLAG_KEYS.PLATFORM_PULSE_PUBLIC)
  const tractionOk = hasMinimalTraction(thresholds)
  const totalCandidates = thresholds.find((t) => t.metric_key === 'total_candidates')

  const sectionFlags = SECTION_FLAG_KEYS.map((key) => flagByKey.get(key)).filter(
    (flag): flag is PulseFeatureFlagRow => Boolean(flag),
  )

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <div>
            <p className="font-semibold text-amber-900">Production Safety Notice</p>
            <p className="mt-1 text-sm text-amber-800">
              Keep the master flag off until readiness thresholds are satisfied.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-jid-ink">Master Visibility</h2>
        {masterFlag ? <FlagRow flag={masterFlag} isMaster showTractionWarning={!tractionOk} /> : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-jid-ink">Section Toggles</h2>
        <div className="space-y-3">
          {sectionFlags.map((flag) => (
            <FlagRow key={flag.key} flag={flag} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-jid-ink">Thresholds</h2>
        {totalCandidates ? (
          <p className="text-sm text-jid-ink/60">
            Recommended baseline: <span className="font-semibold">total_candidates min: 500</span>
          </p>
        ) : null}
        <div className="space-y-3">
          {thresholds.map((threshold) => (
            <ThresholdRow key={threshold.metric_key} threshold={threshold} />
          ))}
        </div>
      </section>
    </div>
  )
}
