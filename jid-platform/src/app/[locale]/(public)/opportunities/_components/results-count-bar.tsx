'use client'

import { useLocale, useTranslations } from 'next-intl'
import { formatNumber } from '@/lib/utils/format'
import { useJobFilters } from './job-filter-context'

export function ResultsCountBar() {
  const t = useTranslations('opportunities.board')
  const locale = useLocale()
  const { resultCount, isFetching } = useJobFilters()
  const formattedCount = formatNumber(resultCount, locale)

  return (
    <p className="text-foreground-400 font-arabic text-sm" aria-live="polite">
      {isFetching ? (
        <span className="bg-border/30 inline-block h-4 w-20 animate-pulse rounded" />
      ) : (
        t('resultsCount', { count: formattedCount })
      )}
    </p>
  )
}
