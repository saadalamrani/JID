'use client'

import { useJobFilters } from './job-filter-context'

export function JobBoardHero() {
  const { resultCount, isFetching } = useJobFilters()
  const formattedCount = resultCount.toLocaleString('ar-SA')

  return (
    <header className="space-y-2 pb-6">
      <h1 className="font-arabic text-3xl font-semibold text-jid-ink">الفرص الوظيفية</h1>
      <p className="font-arabic text-sm text-jid-ink-400">
        {isFetching ? (
          <span className="inline-block h-4 w-24 animate-pulse rounded bg-jid-line/30" />
        ) : (
          <>
            <span className="font-medium text-jid-olive">{formattedCount}</span>
            {' فرصة نشطة'}
          </>
        )}
      </p>
    </header>
  )
}
