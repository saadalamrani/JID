'use client'

import type { RefObject } from 'react'
import {
  CATALOG_GRID_GAP_PX,
  useVirtualizedGrid,
} from '@/lib/hooks/use-virtualized-grid'
import type { MentorCardData } from '@/types/mentor'
import { MentorCard } from '@/components/mentor/mentor-card'

export const MENTOR_CARD_ESTIMATED_HEIGHT = 220
export const MENTOR_ROW_ESTIMATED_HEIGHT = MENTOR_CARD_ESTIMATED_HEIGHT + CATALOG_GRID_GAP_PX

type VirtualizedMentorGridProps = {
  mentors: MentorCardData[]
  scrollElementRef: RefObject<HTMLElement | null>
}

export function VirtualizedMentorGrid({ mentors, scrollElementRef }: VirtualizedMentorGridProps) {
  const { virtualRows, totalHeight, getRowItems, gridStyle, gap, rowVirtualizer } =
    useVirtualizedGrid({
      items: mentors,
      scrollElementRef,
      estimatedRowHeight: MENTOR_ROW_ESTIMATED_HEIGHT,
    })

  return (
    <div
      className="relative w-full"
      style={{ height: totalHeight }}
      role="list"
      aria-label="قائمة المرشدين"
    >
      {virtualRows.map((virtualRow) => {
        const rowMentors = getRowItems(virtualRow.index)
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
            {rowMentors.map((mentor) => (
              <MentorCard key={mentor.user_id} mentor={mentor} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
