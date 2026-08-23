'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCatalogFilters } from './catalog-filter-context'

function buildFilterSummary(
  filters: ReturnType<typeof useCatalogFilters>['filters'],
  debouncedQ: string,
  regions: ReturnType<typeof useCatalogFilters>['regions'],
  sectors: ReturnType<typeof useCatalogFilters>['sectors'],
  t: ReturnType<typeof useTranslations>,
  tFilters: ReturnType<typeof useTranslations>,
): string {
  const parts: string[] = []

  if (debouncedQ.trim()) {
    parts.push(t('searchFilter', { query: debouncedQ.trim() }))
  }

  for (const type of filters.ownership) {
    parts.push(t('ownershipFilter', { value: tFilters(`ownership.${type}`) }))
  }

  for (const slug of filters.regions) {
    const region = regions.find((item) => item.slug === slug)
    parts.push(t('regionFilter', { value: region?.name_ar ?? region?.name_en ?? slug }))
  }

  for (const slug of filters.sectors) {
    const sector = sectors.find((item) => item.slug === slug)
    parts.push(t('sectorFilter', { value: sector?.name_ar ?? sector?.name_en ?? slug }))
  }

  if (filters.sort !== 'manual_order') {
    parts.push(t('sortFilter', { value: tFilters(`sort.${filters.sort}`) }))
  }

  return parts.length > 0 ? parts.join(t('summarySeparator')) : t('noFilters')
}

export function CatalogAnnouncer() {
  const t = useTranslations('catalogPage.search')
  const tFilters = useTranslations('filters')
  const { filters, debouncedQ, resultCount, isFetching, regions, sectors } = useCatalogFilters()
  const [announcement, setAnnouncement] = useState('')

  const filterSummary = useMemo(
    () => buildFilterSummary(filters, debouncedQ, regions, sectors, t, tFilters),
    [filters, debouncedQ, regions, sectors, t, tFilters],
  )

  useEffect(() => {
    if (isFetching) return

    const formattedCount = resultCount.toLocaleString('en-US')
    setAnnouncement(t('announcement', { count: formattedCount, summary: filterSummary }))
  }, [filterSummary, isFetching, resultCount, t])

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  )
}
