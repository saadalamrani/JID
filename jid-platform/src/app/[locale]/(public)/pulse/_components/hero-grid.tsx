import { Suspense } from 'react'
import { AnnouncementsBillboard } from '@/app/[locale]/(public)/pulse/_components/announcements-billboard'
import { BillboardSkeleton } from '@/app/[locale]/(public)/pulse/_components/billboard-skeleton'
import { StatsHub } from '@/app/[locale]/(public)/pulse/_components/stats-hub'
import { StatsHubSkeleton } from '@/app/[locale]/(public)/pulse/_components/stats-hub-skeleton'

type HeroGridProps = {
  showAnnouncements: boolean
  showMetrics: boolean
}

/**
 * Section 6.3 — RTL hero grid.
 *
 * `dir="rtl"` is set explicitly on the grid: in RTL, `col-start-1` is the RIGHT edge.
 * Children own their `col-span` — announcements (primary column) use `lg:col-span-8`,
 * stats hub uses `lg:col-span-4`.
 */
export function HeroGrid({ showAnnouncements, showMetrics }: HeroGridProps) {
  if (!showAnnouncements && !showMetrics) return null

  return (
    <section dir="rtl" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {showAnnouncements ? (
        <div className="lg:col-span-8">
          <Suspense fallback={<BillboardSkeleton />}>
            <AnnouncementsBillboard />
          </Suspense>
        </div>
      ) : null}

      {showMetrics ? (
        <div className="lg:col-span-4">
          <Suspense fallback={<StatsHubSkeleton />}>
            <StatsHub />
          </Suspense>
        </div>
      ) : null}
    </section>
  )
}
