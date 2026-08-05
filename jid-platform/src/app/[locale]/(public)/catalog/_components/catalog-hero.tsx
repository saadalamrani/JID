'use client'

import { useTranslations } from 'next-intl'
import { useCatalogFilters } from './catalog-filter-context'

export function CatalogHero() {
  const t = useTranslations('catalogPage.hero')
  const { resultCount, isFetching } = useCatalogFilters()
  const formattedCount = resultCount.toLocaleString('en-US')

  return (
    <header className="space-y-2 pb-6">
      <h1 className="text-3xl font-semibold text-foreground">{t('title')}</h1>
      <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      <p className="text-sm text-muted-foreground">
        {isFetching ? (
          <span className="bg-border/30 inline-block h-4 w-24 animate-pulse rounded" />
        ) : (
          t('count', { count: formattedCount })
        )}
      </p>
    </header>
  )
}
