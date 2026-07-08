'use client'

import { useCatalogFilters } from './catalog-filter-context'

export function CatalogHero() {
  const { resultCount, isFetching } = useCatalogFilters()
  const formattedCount = resultCount.toLocaleString('ar-SA')

  return (
    <header className="space-y-2 pb-6">
      <h1 className="font-arabic text-3xl font-semibold text-foreground">دليل الجهات</h1>
      <p className="font-arabic text-sm text-muted-foreground">
        {isFetching ? (
          <span className="inline-block h-4 w-24 animate-pulse rounded bg-border/30" />
        ) : (
          <>
            <span className="font-medium text-primary">{formattedCount}</span>
            {' جهة عمل مسجّلة'}
          </>
        )}
      </p>
    </header>
  )
}
