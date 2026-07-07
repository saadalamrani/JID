import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AnnouncementsBillboard } from '@/app/[locale]/(public)/pulse/_components/announcements-billboard'
import { BillboardSkeleton } from '@/app/[locale]/(public)/pulse/_components/billboard-skeleton'
import { MarketTrendsSection } from '@/app/[locale]/(public)/pulse/_components/market-trends-section'
import { PulseDisabledPlaceholder } from '@/app/[locale]/(public)/pulse/_components/pulse-disabled-placeholder'
import { PulseShell } from '@/app/[locale]/(public)/pulse/_components/pulse-shell'
import { StatsHub } from '@/app/[locale]/(public)/pulse/_components/stats-hub'
import { StatsHubSkeleton } from '@/app/[locale]/(public)/pulse/_components/stats-hub-skeleton'
import { TrendsSkeleton } from '@/app/[locale]/(public)/pulse/_components/trends-skeleton'
import { FeatureGate } from '@/lib/feature-flags/feature-gate'
import { FLAG_KEYS } from '@/lib/feature-flags/keys'
import { isFeatureEnabled } from '@/lib/feature-flags/server'
import type { Locale } from '@/lib/i18n/config'
import { isPulseSuperAdminViewer } from '@/lib/pulse/is-super-admin-viewer'

/** Section 6.2 — ISR cache for public pulse shell (1 hour). */
export const revalidate = 3600

type PulsePageProps = {
  params: { locale: string }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pulse')
  return {
    title: t('title'),
    description: t('subtitle'),
  }
}

/**
 * Section 6.2 — Platform Pulse public page.
 * Master flag first; sub-flags gate billboard, live metrics, and trends independently.
 */
export default async function PulsePage({ params }: PulsePageProps) {
  const locale = params.locale as Locale

  const isPublic = await isFeatureEnabled(FLAG_KEYS.PULSE_PUBLIC)
  if (!isPublic) {
    const isSuperAdmin = await isPulseSuperAdminViewer()
    if (!isSuperAdmin) {
      notFound()
    }
    return <PulseDisabledPlaceholder />
  }

  return (
    <PulseShell locale={locale}>
      <section dir="rtl" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <FeatureGate flag={FLAG_KEYS.PULSE_BILLBOARD} fallback={null}>
          <div className="lg:col-span-8">
            <Suspense fallback={<BillboardSkeleton />}>
              <AnnouncementsBillboard />
            </Suspense>
          </div>
        </FeatureGate>

        <FeatureGate flag={FLAG_KEYS.PULSE_LIVE_METRICS} fallback={null}>
          <div className="lg:col-span-4">
            <Suspense fallback={<StatsHubSkeleton />}>
              <StatsHub />
            </Suspense>
          </div>
        </FeatureGate>
      </section>

      <FeatureGate flag={FLAG_KEYS.PULSE_MARKET_TRENDS} fallback={null}>
        <Suspense fallback={<TrendsSkeleton />}>
          <MarketTrendsSection />
        </Suspense>
      </FeatureGate>
    </PulseShell>
  )
}
