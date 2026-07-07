import { getTranslations } from 'next-intl/server'
import { FeatureFlagsPanel } from '@/app/[locale]/(sys)/sys/features/_components/feature-flags-panel'
import { fetchMetricThresholds, fetchPulseFeatureFlags } from '@/lib/features/pulse-admin-queries'

/**
 * Section 12 Step 2 / Master Prompt 4.3 — Platform Pulse feature flags (super_admin /sys only).
 * Canonical path: /sys/features (project uses /sys portal, not /admin).
 */
export default async function SysPlatformPulseFeaturesPage() {
  const t = await getTranslations('sys.features')

  const [flags, thresholds] = await Promise.all([fetchPulseFeatureFlags(), fetchMetricThresholds()])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-1 text-sm text-jid-ink/70">{t('subtitle')}</p>
      </header>

      <FeatureFlagsPanel flags={flags} thresholds={thresholds} />
    </div>
  )
}
