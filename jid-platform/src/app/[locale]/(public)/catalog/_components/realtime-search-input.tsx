'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useCatalogFilters } from './catalog-filter-context'

export function RealtimeSearchInput() {
  const { filters, resultCount, isFetching, setSearch } = useCatalogFilters()
  const formattedCount = resultCount.toLocaleString('ar-SA')

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
          placeholder="ابحث بالاسم أو القطاع أو الوصف..."
          dir="rtl"
          className={cn(
            'h-11 border-border bg-card ps-10 font-arabic text-foreground placeholder:text-foreground/40',
          )}
          aria-label="بحث في دليل الجهات"
        />
      </div>
      <p className="font-arabic text-xs text-foreground-400" aria-hidden="true">
        {isFetching ? (
          <span className="inline-block h-3 w-16 animate-pulse rounded bg-border/30" />
        ) : (
          <>{formattedCount} نتيجة</>
        )}
      </p>
    </div>
  )
}
