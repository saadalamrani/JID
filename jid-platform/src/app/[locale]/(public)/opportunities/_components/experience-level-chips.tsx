'use client'

import { useTranslations } from 'next-intl'
import { JOB_EXPERIENCE_CHIPS } from '@/types/job'
import { cn } from '@/lib/utils'
import { useJobFilters } from './job-filter-context'

export function ExperienceLevelChips() {
  const { filters, toggleExperienceChip } = useJobFilters()
  const t = useTranslations('filters')

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground-400">{t('experienceChipsGroupLabel')}</p>
      <div className="flex flex-wrap gap-2">
        {JOB_EXPERIENCE_CHIPS.map((chip) => {
          const selected = filters.experienceChips.includes(chip.id)
          const label = t(`experienceChips.${chip.id}`)
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => toggleExperienceChip(chip.id)}
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
