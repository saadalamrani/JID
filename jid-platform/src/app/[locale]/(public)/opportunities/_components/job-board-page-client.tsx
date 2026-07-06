'use client'

import { useEffect, useRef } from 'react'
import type { JobsListResult } from '@/types/job'
import { ActiveFiltersBar } from './active-filters-bar'
import { EntityTypeChips } from './entity-type-chips'
import { ExperienceLevelChips } from './experience-level-chips'
import { JobBoardHero } from './job-board-hero'
import { JobCardSkeleton } from './job-card-skeleton'
import { JobFilterProvider, useJobFilters } from './job-filter-context'
import { RegionMultiSelect } from './region-multi-select'
import { ResultsCountBar } from './results-count-bar'
import { SectorMultiSelect } from './sector-multi-select'
import { StickyFilterBar } from './sticky-filter-bar'
import { UrgencyFilterChips } from './urgency-filter-chips'
import { VirtualizedJobGrid } from './virtualized-job-grid'

const SKELETON_COUNT = 8

type JobBoardPageClientProps = {
  initialData: JobsListResult
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

function JobResultsSection() {
  const scrollRef = useRef<HTMLElement | null>(null)
  const { jobs, isLoading, isFetching, error } = useJobFilters()

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

  if (isLoading || (isFetching && jobs.length === 0)) {
    return <JobSkeletonGrid />
  }

  if (jobs.length === 0) {
    return <p className="font-arabic text-sm text-jid-ink-400">لا توجد فرص مطابقة للفلاتر.</p>
  }

  return <VirtualizedJobGrid jobs={jobs} scrollElementRef={scrollRef} />
}

function JobBoardContent() {
  return (
    <>
      <JobBoardHero />
      <StickyFilterBar>
        <ExperienceLevelChips />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <EntityTypeChips />
          <SectorMultiSelect />
          <RegionMultiSelect />
        </div>
        <UrgencyFilterChips />
      </StickyFilterBar>
      <ActiveFiltersBar />
      <section className="mt-6 space-y-3" aria-label="نتائج الفرص الوظيفية">
        <ResultsCountBar />
        <JobResultsSection />
      </section>
    </>
  )
}

export function JobBoardPageClient({ initialData }: JobBoardPageClientProps) {
  return (
    <JobFilterProvider initialData={initialData}>
      <JobBoardContent />
    </JobFilterProvider>
  )
}
