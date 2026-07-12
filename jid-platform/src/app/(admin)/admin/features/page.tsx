import { FeatureFlagsPanel } from './_components/feature-flags-panel'
import { fetchMetricThresholds, fetchPulseFeatureFlags } from '@/lib/features/pulse-admin-queries'

export default async function AdminFeaturesPage() {
  const [flags, thresholds] = await Promise.all([fetchPulseFeatureFlags(), fetchMetricThresholds()])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Feature Flags & Thresholds</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Manage Platform Pulse visibility and readiness thresholds.
        </p>
      </header>

      <FeatureFlagsPanel flags={flags} thresholds={thresholds} />
    </div>
  )
}
