'use client'

import { cn } from '@/lib/utils'
import { useCatalogFilters } from './catalog-filter-context'

export function RegionFilterChips() {
  const { filters, regions, toggleRegion } = useCatalogFilters()

  return (
    <div className="space-y-2">
      <p className="font-arabic text-xs font-medium text-muted-foreground">المنطقة</p>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {regions.map((region) => {
          const selected = filters.regions.includes(region.slug)
          return (
            <button
              key={region.slug}
              type="button"
              onClick={() => toggleRegion(region.slug)}
              aria-pressed={selected}
              aria-label={`${region.name_ar ?? region.name_en}${selected ? '، مُفعّل' : '، غير مُفعّل'}`}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 font-arabic text-sm transition-colors',
                selected
                  ? 'border-jid-olive bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-jid-olive/50',
              )}
            >
              {region.name_ar ?? region.name_en}
            </button>
          )
        })}
      </div>
    </div>
  )
}
