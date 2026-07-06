'use client'

import { URGENCY_FILTER_LABELS, URGENCY_FILTERS } from '@/types/job'
import { cn } from '@/lib/utils'
import { useJobFilters } from './job-filter-context'

export function UrgencyFilterChips() {
  const { filters, toggleUrgency } = useJobFilters()

  return (
    <div className="space-y-2">
      <p className="font-arabic text-xs font-medium text-jid-ink-400">الأولوية</p>
      <div className="flex flex-wrap gap-2">
        {URGENCY_FILTERS.map((value) => {
          const selected = filters.urgency.includes(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggleUrgency(value)}
              aria-pressed={selected}
              aria-label={`${URGENCY_FILTER_LABELS[value]}${selected ? '، مُفعّل' : '، غير مُفعّل'}`}
              className={cn(
                'rounded-full border px-3 py-1.5 font-arabic text-sm transition-colors',
                selected
                  ? 'border-jid-olive bg-jid-olive text-white'
                  : 'border-jid-line bg-white text-jid-ink hover:border-jid-olive/50',
              )}
            >
              {URGENCY_FILTER_LABELS[value]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
