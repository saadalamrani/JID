'use client'

import type { RefObject } from 'react'
import {
  CATALOG_GRID_GAP_PX,
  useVirtualizedGrid,
} from '@/lib/hooks/use-virtualized-grid'
import type { JobCardData } from '@/types/job'
import { JobCard } from './job-card'

export const JOB_CARD_ESTIMATED_HEIGHT = 300
export const JOB_ROW_ESTIMATED_HEIGHT = JOB_CARD_ESTIMATED_HEIGHT + CATALOG_GRID_GAP_PX

type VirtualizedJobGridProps = {
  jobs: JobCardData[]
  scrollElementRef: RefObject<HTMLElement | null>
}

export function VirtualizedJobGrid({ jobs, scrollElementRef }: VirtualizedJobGridProps) {
  const { virtualRows, totalHeight, getRowItems, gridStyle, gap, rowVirtualizer } =
    useVirtualizedGrid({
      items: jobs,
      scrollElementRef,
      estimatedRowHeight: JOB_ROW_ESTIMATED_HEIGHT,
    })

  return (
    <div
      className="relative w-full"
      style={{ height: totalHeight }}
      role="list"
      aria-label="قائمة الفرص الوظيفية"
    >
      {virtualRows.map((virtualRow) => {
        const rowJobs = getRowItems(virtualRow.index)
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
            {rowJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
