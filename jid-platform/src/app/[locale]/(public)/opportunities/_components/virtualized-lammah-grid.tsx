'use client'

import type { RefObject } from 'react'
import {
  CATALOG_GRID_GAP_PX,
  useVirtualizedGrid,
} from '@/lib/hooks/use-virtualized-grid'
import type { LammahOpportunityCard } from '@/types/lammah'
import { LammahCard } from './lammah-card'
import { JOB_CARD_ESTIMATED_HEIGHT } from './virtualized-job-grid'

export const LAMMAH_ROW_ESTIMATED_HEIGHT = JOB_CARD_ESTIMATED_HEIGHT + CATALOG_GRID_GAP_PX

type VirtualizedLammahGridProps = {
  items: LammahOpportunityCard[]
  scrollElementRef: RefObject<HTMLElement | null>
}

export function VirtualizedLammahGrid({ items, scrollElementRef }: VirtualizedLammahGridProps) {
  const { virtualRows, totalHeight, getRowItems, gridStyle, gap, rowVirtualizer } =
    useVirtualizedGrid({
      items,
      scrollElementRef,
      estimatedRowHeight: LAMMAH_ROW_ESTIMATED_HEIGHT,
    })

  return (
    <div
      className="relative w-full"
      style={{ height: totalHeight }}
      role="list"
      aria-label="قائمة فرص لمّاح"
    >
      {virtualRows.map((virtualRow) => {
        const rowItems = getRowItems(virtualRow.index)
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
            {rowItems.map((item) => (
              <LammahCard key={item.id} item={item} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
