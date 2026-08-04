'use client'

import { Info, Radar } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { PlusTeaser } from '@/components/monetization/plus-teaser'
import { EmptyState } from '@/components/shared/empty-state'
import type { LammahPageState } from '@/types/lammah'
import { resolveExperienceLevelsFromChips } from '@/types/job'
import type { LammahOpportunityType } from '@/types/lammah'
import { useJobFilters } from './job-filter-context'
import { LammahOpportunityTypeChips } from './lammah-opportunity-type-chips'
import { VirtualizedLammahGrid } from './virtualized-lammah-grid'

type LammahFeedProps = {
  initialState: LammahPageState
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

function LammahFeedUnlocked({ initialState }: LammahFeedProps) {
  const t = useTranslations('opportunities.lammah')
  const scrollRef = useRef<HTMLElement | null>(null)
  const { filters } = useJobFilters()
  const [opportunityTypes, setOpportunityTypes] = useState<LammahOpportunityType[]>([])
  useEffect(() => {
    scrollRef.current = document.documentElement
  }, [])
  const experienceLevels = useMemo(
    () => resolveExperienceLevelsFromChips(filters.experienceChips) ?? [],
    [filters.experienceChips],
  )
  const items = useMemo(
    () =>
      initialState.data.items.filter((item) => {
        if (opportunityTypes.length > 0 && !opportunityTypes.includes(item.opportunityType)) return false
        if (filters.sectors.length > 0 && (!item.sector || !filters.sectors.includes(item.sector))) return false
        if (filters.regions.length > 0 && (!item.region || !filters.regions.includes(item.region))) return false
        if (
          experienceLevels.length > 0 &&
          (!item.experienceLevel || !experienceLevels.includes(item.experienceLevel))
        ) return false
        if (
          filters.ownership.length > 0 &&
          (!item.ownershipType || !filters.ownership.includes(item.ownershipType))
        ) return false
        return true
      }),
    [
      experienceLevels,
      filters.ownership,
      filters.regions,
      filters.sectors,
      initialState.data.items,
      opportunityTypes,
    ],
  )

  return (
    <div className="space-y-3">
      <LammahOpportunityTypeChips selected={opportunityTypes} onChange={setOpportunityTypes} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p className="font-arabic">{t('resultsCount', { count: items.length })}</p>
        <p className="inline-flex items-center gap-1 font-arabic">
          <Info className="h-3.5 w-3.5" aria-hidden />
          {t('orderingInfo')}
        </p>
      </div>

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

export function LammahFeed({ initialState }: LammahFeedProps) {
  if (!initialState.available) return <LammahUnavailableState />
  if (!initialState.entitled) return <PlusTeaser feature="lammah_feed" />
  return <LammahFeedUnlocked initialState={initialState} />
}
