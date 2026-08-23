'use client'

import { useTranslations } from 'next-intl'
import { URGENCY_FILTERS } from '@/types/job'
import { cn } from '@/lib/utils'
import { useJobFilters } from './job-filter-context'

export function UrgencyFilterChips() {
  const { filters, toggleUrgency } = useJobFilters()
  const t = useTranslations('filters')

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground-400">{t('urgencyGroupLabel')}</p>
      <div className="flex flex-wrap gap-2">
        {URGENCY_FILTERS.map((value) => {
          const selected = filters.urgency.includes(value)
          const label = t(`urgency.${value}`)
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggleUrgency(value)}
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
