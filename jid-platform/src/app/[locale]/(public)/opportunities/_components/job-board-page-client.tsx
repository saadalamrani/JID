'use client'

import { Briefcase } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { JobsListResult } from '@/types/job'
import type { LammahPageState } from '@/types/lammah'
import { EmptyState } from '@/components/shared/empty-state'
import { ActiveFiltersBar } from './active-filters-bar'
import { EntityTypeChips } from './entity-type-chips'
import { ExperienceLevelChips } from './experience-level-chips'
import { JobBoardHero } from './job-board-hero'
import { JobCardSkeleton } from './job-card-skeleton'
import { JobFilterProvider, useJobFilters } from './job-filter-context'
import { LammahFeed } from './lammah-feed'
import { OpportunitiesTabs, type OpportunitiesTab } from './opportunities-tabs'
import { RegionMultiSelect } from './region-multi-select'
import { ResultsCountBar } from './results-count-bar'
import { SectorMultiSelect } from './sector-multi-select'
import { StickyFilterBar } from './sticky-filter-bar'
import { UrgencyFilterChips } from './urgency-filter-chips'
import { VirtualizedJobGrid } from './virtualized-job-grid'

const SKELETON_COUNT = 8

type JobBoardPageClientProps = {
  initialData: JobsListResult
  initialLammahState: LammahPageState
  initialTab: OpportunitiesTab
  setupHint?: string
}

function JobSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <JobCardSkeleton key={index} />
      ))}
    </div>
  )
}

function NativeResultsSection() {
  const scrollRef = useRef<HTMLElement | null>(null)
  const { jobs, isLoading, isFetching, error } = useJobFilters()

  useEffect(() => {
    scrollRef.current = document.documentElement
  }, [])

  if (error) {
    return (
      <p className="font-arabic text-sm text-destructive">تعذّر تحميل النتائج: {error.message}</p>
    )
  }

  if (isLoading || (isFetching && jobs.length === 0)) {
    return <JobSkeletonGrid />
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="لا توجد فرص مطابقة للفلاتر."
        description="جرّب تعديل الفلاتر أو توسيع نطاق البحث."
        className="py-12"
      />
    )
  }

  return <VirtualizedJobGrid jobs={jobs} scrollElementRef={scrollRef} />
}

function JobBoardContent({
  initialLammahState,
  initialTab,
  setupHint,
}: {
  initialLammahState: LammahPageState
  initialTab: OpportunitiesTab
  setupHint?: string
}) {
  const [activeTab, setActiveTab] = useState<OpportunitiesTab>(initialTab)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function selectTab(tab: OpportunitiesTab) {
    setActiveTab(tab)
    const next = new URLSearchParams(searchParams.toString())
    if (tab === 'native') next.delete('tab')
    else next.set('tab', tab)
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <>
      {setupHint ? (
        <div
          role="alert"
          className="border-sem-warning/30 bg-sem-warning/10 mb-6 rounded-lg border px-4 py-3 text-sm text-sem-warning"
        >
          {setupHint}
        </div>
      ) : null}
      <JobBoardHero />
      <OpportunitiesTabs activeTab={activeTab} onTabChange={selectTab} className="mb-4" />
      <StickyFilterBar>
        <ExperienceLevelChips />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <EntityTypeChips />
          <SectorMultiSelect />
          <RegionMultiSelect />
        </div>
        {activeTab === 'native' ? <UrgencyFilterChips /> : null}
      </StickyFilterBar>
      <ActiveFiltersBar />
      <section className="mt-6 space-y-3" aria-label="نتائج الفرص الوظيفية">
        {activeTab === 'native' ? (
          <>
            <ResultsCountBar />
            <NativeResultsSection />
          </>
        ) : (
          <LammahFeed initialState={initialLammahState} />
        )}
      </section>
    </>
  )
}

export function JobBoardPageClient({
  initialData,
  initialLammahState,
  initialTab,
  setupHint,
}: JobBoardPageClientProps) {
  return (
    <JobFilterProvider initialData={initialData}>
      <JobBoardContent
        initialLammahState={initialLammahState}
        initialTab={initialTab}
        setupHint={setupHint}
      />
    </JobFilterProvider>
  )
}
