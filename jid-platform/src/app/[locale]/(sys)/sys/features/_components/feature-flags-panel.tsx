'use client'

import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { FEATURE_FLAG_KEYS } from '@/lib/features/feature-flag-keys'
import { hasMinimalTraction } from '@/lib/features/has-minimal-traction'
import type { MetricThresholdRow, PulseFeatureFlagRow } from '@/lib/features/pulse-admin-queries'
import { PulseFlagRow } from '@/app/[locale]/(sys)/sys/features/_components/flag-row'
import { ThresholdRow } from '@/app/[locale]/(sys)/sys/features/_components/threshold-row'

type FeatureFlagsPanelProps = {
  flags: PulseFeatureFlagRow[]
  thresholds: MetricThresholdRow[]
}

const SECTION_FLAG_KEYS = [
  FEATURE_FLAG_KEYS.PLATFORM_PULSE_ANNOUNCEMENTS,
  FEATURE_FLAG_KEYS.PLATFORM_PULSE_METRICS,
  FEATURE_FLAG_KEYS.PLATFORM_PULSE_TRENDS,
] as const

/** Section 12 Step 2 / Master Prompt 4.3 — Platform Pulse feature flags control panel. */
export function FeatureFlagsPanel({ flags, thresholds }: FeatureFlagsPanelProps) {
  const t = useTranslations('sys.features')

  const flagByKey = new Map(flags.map((flag) => [flag.key, flag]))
  const masterFlag = flagByKey.get(FEATURE_FLAG_KEYS.PLATFORM_PULSE_PUBLIC)
  const tractionOk = hasMinimalTraction(thresholds)

  const sectionFlags = SECTION_FLAG_KEYS.map((key) => flagByKey.get(key)).filter(
    (flag): flag is PulseFeatureFlagRow => Boolean(flag),
  )

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <div>
            <p className="font-semibold text-amber-900">{t('alert.title')}</p>
            <p className="mt-1 text-sm text-amber-800">{t('alert.body')}</p>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-jid-ink">{t('masterTitle')}</h2>
        <p className="text-sm text-jid-ink/60">{t('masterSubtitle')}</p>
        {masterFlag ? (
          <PulseFlagRow
            flag={masterFlag}
            isMaster
            showTractionWarning={!tractionOk}
          />
        ) : null}
        {!tractionOk ? (
          <p className="text-sm text-jid-ink/55">{t('tractionBelowRecommended')}</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-jid-ink">{t('sectionsTitle')}</h2>
        <p className="text-sm text-jid-ink/60">{t('sectionsSubtitle')}</p>
        <div className="space-y-3">
          {sectionFlags.map((flag) => (
            <PulseFlagRow key={flag.key} flag={flag} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-jid-ink">{t('thresholdsTitle')}</h2>
        <p className="text-sm text-jid-ink/60">{t('thresholdsSubtitle')}</p>
        <div className="space-y-3">
          {thresholds.map((threshold) => (
            <ThresholdRow key={threshold.metric_key} threshold={threshold} />
          ))}
        </div>
      </section>
    </div>
  )
}
