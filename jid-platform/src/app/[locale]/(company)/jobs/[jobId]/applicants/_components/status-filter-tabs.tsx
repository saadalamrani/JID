'use client'

import type { TriageFilterTab } from '@/types/application'
import { TRIAGE_FILTER_TABS, TRIAGE_FILTER_TAB_LABELS } from '@/types/application'
import { cn } from '@/lib/utils'

type StatusFilterTabsProps = {
  active: TriageFilterTab
  onChange: (tab: TriageFilterTab) => void
  counts?: Partial<Record<TriageFilterTab, number>>
}

/** Section 5.2 — filter tabs by triage status. */
export function StatusFilterTabs({ active, onChange, counts }: StatusFilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="تصفية المتقدمين حسب الحالة"
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
                ? 'bg-jid-olive text-white'
                : 'border border-jid-line bg-white text-jid-ink hover:bg-jid-beige',
            )}
          >
            {TRIAGE_FILTER_TAB_LABELS[tab]}
            {count != null ? ` (${count})` : ''}
          </button>
        )
      })}
    </div>
  )
}
