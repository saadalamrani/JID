'use client'

import { useTranslations } from 'next-intl'
import { SectorFilter } from '@/components/filters/sector-filter'
import { useMentorFilters } from './mentor-filter-context'

export function SectorFilterControl() {
  const t = useTranslations('mentorship.discovery.filters')
  const { filters, sectors, toggleSector } = useMentorFilters()

  return (
    <SectorFilter
      label={t('sector')}
      sectors={sectors ?? []}
      selected={filters.sectors}
      onToggle={toggleSector}
      emptyLabel={t('sectorEmpty')}
      selectedLabel={(count) => t('sectorSelected', { count })}
    />
  )
}
