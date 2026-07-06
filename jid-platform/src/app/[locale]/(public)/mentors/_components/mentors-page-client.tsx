'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { track } from '@/lib/analytics/track'
import { StickyFilterBar } from '@/app/[locale]/(public)/catalog/_components/sticky-filter-bar'
import type { MentorsListResult } from '@/types/mentor'
import { AvailabilityFilter } from './availability-filter'
import { EmptyMentorState } from './empty-mentor-state'
import { MentorDiscoveryHero } from './mentor-discovery-hero'
import { MentorFilterProvider, useMentorFilters } from './mentor-filter-context'
import {
  ExpertiseAreaFilter,
  LanguageFilter,
  NationalityFilter,
  SpecializationFilter,
} from './mentor-filters'
import { SectorFilterControl } from './sector-filter-control'
import { VirtualizedMentorGrid } from './virtualized-mentor-grid'

const SKELETON_COUNT = 8

function MentorSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <div
          key={index}
          className="h-[220px] animate-pulse rounded-xl border border-jid-line bg-jid-line/20"
        />
      ))}
    </div>
  )
}

function MentorResultsSection() {
  const t = useTranslations('mentorship.discovery')
  const scrollRef = useRef<HTMLElement | null>(null)
  const { mentors, isLoading, isFetching, error, stats, hasActiveFilters } = useMentorFilters()

  useEffect(() => {
    scrollRef.current = document.documentElement
  }, [])

  useEffect(() => {
    if (!isLoading && mentors.length > 0) {
      track('mentor_discovered', { count: mentors.length })
    }
  }, [isLoading, mentors.length])

  if (error) {
    return (
      <p className="font-arabic text-sm text-red-600">
        {t('loadError')}: {error.message}
      </p>
    )
  }

  if (isLoading || (isFetching && mentors.length === 0)) {
    return <MentorSkeletonGrid />
  }

  if (mentors.length === 0) {
    const coldStart = stats.activeMentorCount === 0 && !hasActiveFilters
    return <EmptyMentorState variant={coldStart ? 'cold_start' : 'no_matches'} />
  }

  return <VirtualizedMentorGrid mentors={mentors} scrollElementRef={scrollRef} />
}

function MentorsPageContent() {
  const t = useTranslations('mentorship.discovery')
  const { resultCount, isFetching } = useMentorFilters()

  return (
    <>
      <MentorDiscoveryHero />
      <StickyFilterBar className="bg-white/95">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SectorFilterControl />
          <ExpertiseAreaFilter />
          <SpecializationFilter />
          <LanguageFilter />
          <NationalityFilter />
          <AvailabilityFilter />
        </div>
      </StickyFilterBar>

      <p className="mt-4 font-arabic text-sm text-jid-ink/60" aria-live="polite">
        {isFetching ? (
          <span className="inline-block h-4 w-24 animate-pulse rounded bg-jid-line/30" />
        ) : (
          t('resultsCount', { count: resultCount })
        )}
      </p>

      <section className="mt-4" aria-label={t('resultsAria')}>
        <MentorResultsSection />
      </section>
    </>
  )
}

type MentorsPageClientProps = {
  initialData: MentorsListResult
}

export function MentorsPageClient({ initialData }: MentorsPageClientProps) {
  return (
    <MentorFilterProvider initialData={initialData}>
      <MentorsPageContent />
    </MentorFilterProvider>
  )
}
