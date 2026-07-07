import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { HeroGrid } from '@/app/[locale]/(public)/pulse/_components/hero-grid'
import { MarketTrendsSection } from '@/app/[locale]/(public)/pulse/_components/market-trends-section'
import { PulseDisabledPlaceholder } from '@/app/[locale]/(public)/pulse/_components/pulse-disabled-placeholder'
import { PulseShell } from '@/app/[locale]/(public)/pulse/_components/pulse-shell'
import { TrendsSkeleton } from '@/app/[locale]/(public)/pulse/_components/trends-skeleton'
import { FEATURE_FLAG_KEYS } from '@/lib/features/feature-flag-keys'
import { getFeatureFlag } from '@/lib/features/use-feature-flag'
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
 * Master flag first; sub-flags gate hero sections and trends independently.
 */
export default async function PulsePage({ params }: PulsePageProps) {
  const locale = params.locale as Locale

  const isPublic = await getFeatureFlag(FEATURE_FLAG_KEYS.PLATFORM_PULSE_PUBLIC)
  if (!isPublic) {
    const isSuperAdmin = await isPulseSuperAdminViewer()
    if (!isSuperAdmin) {
      notFound()
    }
    return <PulseDisabledPlaceholder />
  }

  const [showAnnouncements, showMetrics, showTrends] = await Promise.all([
    getFeatureFlag(FEATURE_FLAG_KEYS.PLATFORM_PULSE_ANNOUNCEMENTS),
    getFeatureFlag(FEATURE_FLAG_KEYS.PLATFORM_PULSE_METRICS),
    getFeatureFlag(FEATURE_FLAG_KEYS.PLATFORM_PULSE_TRENDS),
  ])

  return (
    <PulseShell locale={locale}>
      {(showAnnouncements || showMetrics) && (
        <HeroGrid showAnnouncements={showAnnouncements} showMetrics={showMetrics} />
      )}

      {showTrends ? (
        <Suspense fallback={<TrendsSkeleton />}>
          <MarketTrendsSection />
        </Suspense>
      ) : null}
    </PulseShell>
  )
}
