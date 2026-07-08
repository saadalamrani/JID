'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useMentorFilters } from './mentor-filter-context'

export function AvailabilityFilter() {
  const t = useTranslations('mentorship.discovery.filters')
  const { filters, setAcceptingOnly } = useMentorFilters()

  return (
    <div className="space-y-2">
      <p className="font-arabic text-xs font-medium text-muted-foreground">{t('availability')}</p>
      <button
        type="button"
        role="switch"
        aria-checked={filters.accepting_only}
        onClick={() => setAcceptingOnly(!filters.accepting_only)}
        className={cn(
          'inline-flex w-full items-center justify-between rounded-lg border px-3 py-2 font-arabic text-sm transition-colors',
          filters.accepting_only
            ? 'border-jid-olive bg-primary/10 text-primary'
            : 'border-border bg-card text-muted-foreground hover:border-jid-olive/40',
        )}
      >
        <span>{t('acceptingOnly')}</span>
        <span
          className={cn(
            'relative h-5 w-9 rounded-full transition-colors',
            filters.accepting_only ? 'bg-primary' : 'bg-jid-line',
          )}
          aria-hidden
        >
          <span
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform',
              filters.accepting_only ? 'translate-x-4' : 'translate-x-0.5',
            )}
          />
        </span>
      </button>
    </div>
  )
}
