'use client'

import { useTranslations } from 'next-intl'
import type { TriageFilterTab } from '@/types/application'
import { TRIAGE_FILTER_TABS } from '@/types/application'
import { cn } from '@/lib/utils'

type StatusFilterTabsProps = {
  active: TriageFilterTab
  onChange: (tab: TriageFilterTab) => void
  counts?: Partial<Record<TriageFilterTab, number>>
}

/** Section 5.2 — filter tabs by triage status. */
export function StatusFilterTabs({ active, onChange, counts }: StatusFilterTabsProps) {
  const t = useTranslations('company.applicants.tabs')
  const tAria = useTranslations('company.applicants')

  return (
    <div
      role="tablist"
      aria-label={tAria('tabsAria')}
      className="flex flex-wrap gap-2"
    >
      {TRIAGE_FILTER_TABS.map((tab) => {
        const isActive = tab === active
        const count = counts?.[tab]

        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={cn(
              'rounded-full px-4 py-2 font-arabic text-sm transition-colors',
              isActive
                ? 'bg-primary text-white'
                : 'border border-border bg-card text-foreground hover:bg-background',
            )}
          >
            {t(tab)}
            {count != null ? ` (${count})` : ''}
          </button>
        )
      })}
    </div>
  )
}
