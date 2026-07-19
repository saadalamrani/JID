'use client'

import { useEffect, type RefObject } from 'react'
import { useTranslations } from 'next-intl'
import type { CompanyCardData } from '@/types/catalog'
import { useVirtualizedGrid } from '@/lib/hooks/use-virtualized-grid'
import { CompanyCard } from './company-card'

type VirtualizedCardGridProps = {
  companies: CompanyCardData[]
  scrollElementRef: RefObject<HTMLElement | null>
  onNearEnd?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

export function VirtualizedCardGrid({
  companies,
  scrollElementRef,
  onNearEnd,
  hasMore = false,
  isLoadingMore = false,
}: VirtualizedCardGridProps) {
  const t = useTranslations('catalogPage.search')
  const { virtualRows, totalHeight, getRowItems, gridStyle, gap, rowVirtualizer, rowCount } =
    useVirtualizedGrid({
      items: companies,
      scrollElementRef,
    })

  useEffect(() => {
    if (!onNearEnd || !hasMore || isLoadingMore) return

    const lastRow = virtualRows[virtualRows.length - 1]
    if (!lastRow) return

    if (lastRow.index >= rowCount - 2) {
      onNearEnd()
    }
  }, [virtualRows, rowCount, onNearEnd, hasMore, isLoadingMore])

  return (
    <div
      className="relative w-full"
      style={{ height: totalHeight }}
      aria-busy={isLoadingMore}
      role="list"
      aria-label={t('listLabel')}
    >
      {virtualRows.map((virtualRow) => {
        const rowCompanies = getRowItems(virtualRow.index)
        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            className="absolute left-0 top-0 grid w-full"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
              gap: `${gap}px`,
              ...gridStyle,
            }}
          >
            {rowCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
