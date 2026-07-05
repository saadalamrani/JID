'use client'

import { useEffect, useMemo, useState } from 'react'
import { OWNERSHIP_LABELS, SORT_LABELS } from '@/types/catalog'
import { useCatalogFilters } from './catalog-filter-context'

function buildFilterSummary(
  filters: ReturnType<typeof useCatalogFilters>['filters'],
  debouncedQ: string,
  regions: ReturnType<typeof useCatalogFilters>['regions'],
  sectors: ReturnType<typeof useCatalogFilters>['sectors'],
): string {
  const parts: string[] = []

  if (debouncedQ.trim()) {
    parts.push(`بحث: ${debouncedQ.trim()}`)
  }

  for (const type of filters.ownership) {
    parts.push(`ملكية: ${OWNERSHIP_LABELS[type]}`)
  }

  for (const slug of filters.regions) {
    const region = regions.find((item) => item.slug === slug)
    parts.push(`منطقة: ${region?.name_ar ?? region?.name_en ?? slug}`)
  }

  for (const slug of filters.sectors) {
    const sector = sectors.find((item) => item.slug === slug)
    parts.push(`قطاع: ${sector?.name_ar ?? sector?.name_en ?? slug}`)
  }

  if (filters.sort !== 'manual_order') {
    parts.push(`ترتيب: ${SORT_LABELS[filters.sort]}`)
  }

  return parts.length > 0 ? parts.join('، ') : 'بدون فلاتر'
}

export function CatalogAnnouncer() {
  const { filters, debouncedQ, resultCount, isFetching, regions, sectors } = useCatalogFilters()
  const [announcement, setAnnouncement] = useState('')

  const filterSummary = useMemo(
    () => buildFilterSummary(filters, debouncedQ, regions, sectors),
    [filters, debouncedQ, regions, sectors],
  )

  useEffect(() => {
    if (isFetching) return

    const formattedCount = resultCount.toLocaleString('ar-SA')
    setAnnouncement(`${formattedCount} نتيجة. ${filterSummary}`)
  }, [filterSummary, isFetching, resultCount])

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  )
}
