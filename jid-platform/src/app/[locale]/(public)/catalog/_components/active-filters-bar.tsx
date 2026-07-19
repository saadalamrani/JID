'use client'

import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { OWNERSHIP_LABELS } from '@/types/catalog'
import { cn } from '@/lib/utils'
import { useCatalogFilters } from './catalog-filter-context'

type ActiveFilterPill = {
  key: string
  label: string
  onRemove: () => void
}

export function ActiveFiltersBar() {
  const t = useTranslations('catalogPage.search')
  const {
    filters,
    debouncedQ,
    regions,
    sectors,
    hasActiveFilters,
    clearAll,
    clearSearch,
    removeOwnership,
    removeRegion,
    removeSector,
  } = useCatalogFilters()

  if (!hasActiveFilters) return null

  const pills: ActiveFilterPill[] = []

  if (debouncedQ.trim()) {
    pills.push({
      key: `q:${debouncedQ}`,
      label: t('searchFilter', { query: debouncedQ.trim() }),
      onRemove: clearSearch,
    })
  }

  for (const type of filters.ownership) {
    pills.push({
      key: `ownership:${type}`,
      label: OWNERSHIP_LABELS[type],
      onRemove: () => removeOwnership(type),
    })
  }

  for (const slug of filters.regions) {
    const region = regions.find((item) => item.slug === slug)
    pills.push({
      key: `region:${slug}`,
      label: region?.name_ar ?? region?.name_en ?? slug,
      onRemove: () => removeRegion(slug),
    })
  }

  for (const slug of filters.sectors) {
    const sector = sectors.find((item) => item.slug === slug)
    pills.push({
      key: `sector:${slug}`,
      label: sector?.name_ar ?? sector?.name_en ?? slug,
      onRemove: () => removeSector(slug),
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      {pills.map((pill) => (
        <span
          key={pill.key}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1',
            'font-arabic text-xs text-foreground',
          )}
        >
          {pill.label}
          <button
            type="button"
            onClick={pill.onRemove}
            className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label={t('removeFilter', { filter: pill.label })}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={clearAll}
        className="h-7 font-arabic text-xs text-primary hover:bg-background hover:text-primary"
      >
        {t('clearAll')}
      </Button>
    </div>
  )
}
