'use client'

import { OWNERSHIP_TYPES, OWNERSHIP_LABELS, type OwnershipType } from '@/types/catalog'
import { cn } from '@/lib/utils'
import { useCatalogFilters } from './catalog-filter-context'

export function OwnershipFilterChips() {
  const { filters, toggleOwnership } = useCatalogFilters()

  return (
    <div className="space-y-2">
      <p className="font-arabic text-xs font-medium text-muted-foreground">نوع الملكية</p>
      <div className="flex flex-wrap gap-2">
        {OWNERSHIP_TYPES.map((type) => {
          const selected = filters.ownership.includes(type)
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleOwnership(type)}
              aria-pressed={selected}
              aria-label={`${OWNERSHIP_LABELS[type as OwnershipType]}${selected ? '، مُفعّل' : '، غير مُفعّل'}`}
              className={cn(
                'rounded-full border px-3 py-1.5 font-arabic text-sm transition-colors',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary/25',
              )}
            >
              {OWNERSHIP_LABELS[type as OwnershipType]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
