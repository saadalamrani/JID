'use client'

import { JOB_EXPERIENCE_CHIPS } from '@/types/job'
import { cn } from '@/lib/utils'
import { useJobFilters } from './job-filter-context'

export function ExperienceLevelChips() {
  const { filters, toggleExperienceChip } = useJobFilters()

  return (
    <div className="space-y-2">
      <p className="font-arabic text-xs font-medium text-foreground-400">مستوى الخبرة</p>
      <div className="flex flex-wrap gap-2">
        {JOB_EXPERIENCE_CHIPS.map((chip) => {
          const selected = filters.experienceChips.includes(chip.id)
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => toggleExperienceChip(chip.id)}
              aria-pressed={selected}
              aria-label={`${chip.label}${selected ? '، مُفعّل' : '، غير مُفعّل'}`}
              className={cn(
                'rounded-full border px-3 py-1.5 font-arabic text-sm transition-colors',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary/25',
              )}
            >
              {chip.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
