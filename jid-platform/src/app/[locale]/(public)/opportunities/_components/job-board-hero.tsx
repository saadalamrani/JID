'use client'

import { useLocale, useTranslations } from 'next-intl'
import { formatNumber } from '@/lib/utils/format'
import { useJobFilters } from './job-filter-context'

export function JobBoardHero() {
  const t = useTranslations('opportunities.board')
  const locale = useLocale()
  const { resultCount, isFetching } = useJobFilters()
  const formattedCount = formatNumber(resultCount, locale)

  return (
    <header className="space-y-2 pb-6">
      <h1 className="font-arabic text-3xl font-semibold text-foreground">{t('title')}</h1>
      <p className="text-foreground-400 font-arabic text-sm">
        {isFetching ? (
          <span className="bg-border/30 inline-block h-4 w-24 animate-pulse rounded" />
        ) : (
          t('activeCount', { count: formattedCount })
        )}
      </p>
    </header>
  )
}
