'use client'

import dynamic from 'next/dynamic'
import { Suspense, useEffect, useRef } from 'react'
import type { CatalogCompaniesResult } from '@/types/catalog'
import { ActiveFiltersBar } from './active-filters-bar'
import { CatalogAnnouncer } from './catalog-announcer'
import { CatalogFilterProvider, useCatalogFilters } from './catalog-filter-context'
import { CatalogHero } from './catalog-hero'
import { CatalogEmptyState } from './empty-state'
import { CompanyCardSkeleton } from './company-card-skeleton'
import { OwnershipFilterChips } from './ownership-filter-chips'
import { RealtimeSearchInput } from './realtime-search-input'
import { RegionFilterChips } from './region-filter-chips'
import { SortDropdown } from './sort-dropdown'
import { StickyFilterBar } from './sticky-filter-bar'
import { VirtualizedCardGrid } from './virtualized-card-grid'

const SectorMultiSelect = dynamic(
  () => import('./sector-multi-select').then((mod) => ({ default: mod.SectorMultiSelect })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2">
        <div className="h-4 w-12 animate-pulse rounded bg-jid-line/25" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-jid-line/20" />
      </div>
    ),
  },
)

const SKELETON_COUNT = 8

type CatalogPageClientProps = {
  initialData: CatalogCompaniesResult
  setupHint?: string
}

function CatalogSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <CompanyCardSkeleton key={index} />
      ))}
    </div>
  )
}

function CatalogResultsSection() {
  const scrollRef = useRef<HTMLElement | null>(null)
  const {
    companies,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    hasActiveFilters,
    error,
    isHydrated,
  } = useCatalogFilters()

  useEffect(() => {
    scrollRef.current = document.documentElement
  }, [])

  if (error) {
    return (
      <p className="font-arabic text-sm text-destructive">
        تعذّر تحميل النتائج: {error.message}
      </p>
    )
  }

  if (!isHydrated || isLoading || (isFetching && companies.length === 0)) {
    return <CatalogSkeletonGrid />
  }

  if (companies.length === 0 && hasActiveFilters) {
    return <CatalogEmptyState />
  }

  if (companies.length === 0) {
    return <p className="font-arabic text-sm text-jid-ink/60">لا توجد جهات مسجّلة.</p>
  }

  return (
    <VirtualizedCardGrid
      companies={companies}
      scrollElementRef={scrollRef}
      hasMore={hasNextPage}
      isLoadingMore={isFetchingNextPage}
      onNearEnd={fetchNextPage}
    />
  )
}

function CatalogPageContent({ setupHint }: { setupHint?: string }) {
  return (
    <>
      {setupHint ? (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {setupHint}
        </div>
      ) : null}
      <CatalogAnnouncer />
      <CatalogHero />
      <StickyFilterBar>
        <RealtimeSearchInput />
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-4 sm:grid-cols-2">
            <OwnershipFilterChips />
            <Suspense
              fallback={
                <div className="space-y-2">
                  <div className="h-4 w-12 animate-pulse rounded bg-jid-line/25" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-jid-line/20" />
                </div>
              }
            >
              <SectorMultiSelect />
            </Suspense>
          </div>
          <SortDropdown />
        </div>
        <RegionFilterChips />
      </StickyFilterBar>
      <ActiveFiltersBar />
      <section className="mt-6" aria-label="نتائج دليل الجهات">
        <CatalogResultsSection />
      </section>
    </>
  )
}

export function CatalogPageClient({ initialData, setupHint }: CatalogPageClientProps) {
  return (
    <CatalogFilterProvider initialData={initialData}>
      <CatalogPageContent setupHint={setupHint} />
    </CatalogFilterProvider>
  )
}
