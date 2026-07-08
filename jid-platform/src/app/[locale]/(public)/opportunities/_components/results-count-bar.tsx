'use client'

import { useJobFilters } from './job-filter-context'

export function ResultsCountBar() {
  const { resultCount, isFetching } = useJobFilters()
  const formattedCount = resultCount.toLocaleString('ar-SA')

  return (
    <p className="font-arabic text-sm text-foreground-400" aria-live="polite">
      {isFetching ? (
        <span className="inline-block h-4 w-20 animate-pulse rounded bg-border/30" />
      ) : (
        <>{formattedCount} نتيجة</>
      )}
    </p>
  )
}
