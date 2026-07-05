'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'

export const CATALOG_CARD_ESTIMATED_HEIGHT = 220
export const CATALOG_GRID_GAP_PX = 16
export const CATALOG_ROW_ESTIMATED_HEIGHT =
  CATALOG_CARD_ESTIMATED_HEIGHT + CATALOG_GRID_GAP_PX

const COLUMN_BREAKPOINTS = [
  { minWidth: 1280, columns: 4 },
  { minWidth: 1024, columns: 3 },
  { minWidth: 640, columns: 2 },
  { minWidth: 0, columns: 1 },
] as const

function resolveColumnCount(viewportWidth: number): number {
  for (const breakpoint of COLUMN_BREAKPOINTS) {
    if (viewportWidth >= breakpoint.minWidth) return breakpoint.columns
  }
  return 1
}

export function useGridColumnCount(): number {
  const [columnCount, setColumnCount] = useState(1)

  useEffect(() => {
    const update = () => setColumnCount(resolveColumnCount(window.innerWidth))
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])

  return columnCount
}

type UseVirtualizedGridOptions<T> = {
  items: T[]
  scrollElementRef: RefObject<HTMLElement | null>
  estimatedRowHeight?: number
  gap?: number
  /** Overscan count in rows (each row renders up to columnCount items). */
  overscan?: number
}

export function useVirtualizedGrid<T>({
  items,
  scrollElementRef,
  estimatedRowHeight = CATALOG_ROW_ESTIMATED_HEIGHT,
  overscan = 5,
}: UseVirtualizedGridOptions<T>) {
  const columnCount = useGridColumnCount()
  const rowCount = Math.ceil(items.length / columnCount) || 0

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () =>
      scrollElementRef.current ??
      (typeof document !== 'undefined' ? document.documentElement : null),
    estimateSize: () => estimatedRowHeight,
    overscan,
    measureElement:
      typeof window !== 'undefined' && 'ResizeObserver' in window
        ? (element) => element.getBoundingClientRect().height
        : undefined,
  })

  const getRowItems = useCallback(
    (rowIndex: number): T[] => {
      const start = rowIndex * columnCount
      return items.slice(start, start + columnCount)
    },
    [columnCount, items],
  )

  const virtualRows = rowVirtualizer.getVirtualItems()

  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
    }),
    [columnCount],
  )

  return {
    columnCount,
    rowCount,
    rowVirtualizer,
    virtualRows,
    totalHeight: rowVirtualizer.getTotalSize(),
    getRowItems,
    gridStyle,
    gap: CATALOG_GRID_GAP_PX,
  }
}
