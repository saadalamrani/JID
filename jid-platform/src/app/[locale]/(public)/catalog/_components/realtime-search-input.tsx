'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useCatalogFilters } from './catalog-filter-context'

export function RealtimeSearchInput() {
  const t = useTranslations('catalogPage.search')
  const { filters, resultCount, isFetching, setSearch, clearSearch } = useCatalogFilters()
  const formattedCount = resultCount.toLocaleString('en-US')

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
          aria-hidden
        />
        <Input
          type="search"
          value={filters.q}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && filters.q) {
              event.preventDefault()
              clearSearch()
            }
          }}
          placeholder={t('placeholder')}
          className={cn(
            'h-11 border-border bg-card ps-10 font-arabic text-foreground placeholder:text-foreground/40',
          )}
          aria-label={t('inputLabel')}
          aria-describedby="catalog-search-keyboard-hint"
        />
      </div>
      <p className="font-arabic text-xs text-foreground-400" aria-live="polite">
        {isFetching ? t('loading') : t('resultCount', { count: formattedCount })}
      </p>
      <p id="catalog-search-keyboard-hint" className="sr-only">
        {t('keyboardInstructions')}
      </p>
    </div>
  )
}
