'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { PlusGate } from '@/components/monetization/plus-gate'
import { EmptyState } from '@/components/shared/empty-state'
import { useLammahFeedQuery } from '@/lib/hooks/use-lammah-feed-query'
import { Radar } from 'lucide-react'
import { JobCardSkeleton } from './job-card-skeleton'
import { useJobFilters } from './job-filter-context'
import { VirtualizedLammahGrid } from './virtualized-lammah-grid'

const SKELETON_COUNT = 8

function LammahSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <JobCardSkeleton key={index} />
      ))}
    </div>
  )
}

function LammahFeedUnlocked() {
  const t = useTranslations('opportunities.lammah')
  const scrollRef = useRef<HTMLElement | null>(null)
  const { filters } = useJobFilters()

  const lammahFilters = useMemo(
    () => ({
      experienceChips: filters.experienceChips,
      ownership: filters.ownership,
      regions: filters.regions,
      sectors: filters.sectors,
    }),
    [filters.experienceChips, filters.ownership, filters.regions, filters.sectors],
  )

  const { data, isLoading, isFetching, error } = useLammahFeedQuery(lammahFilters)

  useEffect(() => {
    scrollRef.current = document.documentElement
  }, [])

  if (error) {
    return (
      <p className="font-arabic text-sm text-destructive">
        {t('loadError')}: {error.message}
      </p>
    )
  }

  if (isLoading || (isFetching && !data)) {
    return <LammahSkeletonGrid />
  }

  const items = data?.items ?? []
  const count = data?.count ?? 0

  return (
    <div className="space-y-3">
      <p className="font-arabic text-sm text-muted-foreground">
        {t('resultsCount', { count })}
      </p>

      {items.length === 0 ? (
        <EmptyState
          icon={Radar}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          className="py-12"
        />
      ) : (
        <VirtualizedLammahGrid items={items} scrollElementRef={scrollRef} />
      )}
    </div>
  )
}

function LammahUnavailableState() {
  const t = useTranslations('opportunities.lammah')

  return (
    <EmptyState
      icon={Radar}
      title={t('unavailableTitle')}
      description={t('unavailableDescription')}
      className="py-12"
    />
  )
}

export function LammahFeed() {
  return (
    <PlusGate feature="lammah_feed" fallback={<LammahUnavailableState />}>
      <LammahFeedUnlocked />
    </PlusGate>
  )
}
