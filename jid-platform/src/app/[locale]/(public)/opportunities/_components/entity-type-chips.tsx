'use client'

import { useTranslations } from 'next-intl'
import { OWNERSHIP_TYPES } from '@/types/catalog'
import { cn } from '@/lib/utils'
import { useJobFilters } from './job-filter-context'

export function EntityTypeChips() {
  const { filters, toggleOwnership } = useJobFilters()
  const t = useTranslations('filters')

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground-400">{t('ownershipGroupLabel')}</p>
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
