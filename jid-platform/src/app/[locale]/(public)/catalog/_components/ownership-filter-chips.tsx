'use client'

import { useTranslations } from 'next-intl'
import { OWNERSHIP_TYPES } from '@/types/catalog'
import { cn } from '@/lib/utils'
import { useCatalogFilters } from './catalog-filter-context'

export function OwnershipFilterChips() {
  const { filters, toggleOwnership } = useCatalogFilters()
  const t = useTranslations('filters')

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{t('ownershipGroupLabel')}</p>
      <div className="flex flex-wrap gap-2">
        {OWNERSHIP_TYPES.map((type) => {
          const selected = filters.ownership.includes(type)
          const label = t(`ownership.${type}`)
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleOwnership(type)}
              aria-pressed={selected}
              aria-label={`${label}${t(selected ? 'a11y.selected' : 'a11y.notSelected')}`}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary/25',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
