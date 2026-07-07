import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AnnouncementsBillboard } from '@/app/[locale]/(public)/pulse/_components/announcements-billboard'
import { BillboardSkeleton } from '@/app/[locale]/(public)/pulse/_components/billboard-skeleton'
import { HeroGrid } from '@/app/[locale]/(public)/pulse/_components/hero-grid'
import { MarketTrendsSection } from '@/app/[locale]/(public)/pulse/_components/market-trends-section'
import { PulseDisabledPlaceholder } from '@/app/[locale]/(public)/pulse/_components/empty-state'
import { PulseShell } from '@/app/[locale]/(public)/pulse/_components/pulse-shell'
import { TrendsSkeleton } from '@/app/[locale]/(public)/pulse/_components/trends-skeleton'
import { FLAG_KEYS } from '@/lib/feature-flags/keys'
import { areFeaturesEnabled } from '@/lib/feature-flags/server'
import type { Locale } from '@/lib/i18n/config'

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

  const pulseFlags = await areFeaturesEnabled([
    FLAG_KEYS.PULSE_PUBLIC,
    FLAG_KEYS.PULSE_BILLBOARD,
    FLAG_KEYS.PULSE_LIVE_METRICS,
    FLAG_KEYS.PULSE_MARKET_TRENDS,
  ] as const)

  if (!pulseFlags[FLAG_KEYS.PULSE_PUBLIC]) {
    return <PulseDisabledPlaceholder />
  }

  return (
    <PulseShell locale={locale}>
      <HeroGrid
        showAnnouncements={pulseFlags[FLAG_KEYS.PULSE_BILLBOARD]}
        showMetrics={pulseFlags[FLAG_KEYS.PULSE_LIVE_METRICS]}
      />

      {pulseFlags[FLAG_KEYS.PULSE_MARKET_TRENDS] ? (
        <Suspense fallback={<TrendsSkeleton />}>
          <MarketTrendsSection />
        </Suspense>
      ) : null}
    </PulseShell>
  )
}
