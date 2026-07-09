'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export type OpportunitiesTab = 'native' | 'lammah'

type OpportunitiesTabsProps = {
  activeTab: OpportunitiesTab
  onTabChange: (tab: OpportunitiesTab) => void
  className?: string
}

export function OpportunitiesTabs({ activeTab, onTabChange, className }: OpportunitiesTabsProps) {
  const t = useTranslations('opportunities.tabs')

  const tabs: { id: OpportunitiesTab; label: string }[] = [
    { id: 'native', label: t('native') },
    { id: 'lammah', label: t('lammah') },
  ]

  return (
    <div
      role="tablist"
      aria-label={t('ariaLabel')}
      className={cn('flex flex-wrap gap-2', className)}
    >
      {tabs.map((tab) => {
        const selected = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'rounded-full px-4 py-2 font-arabic text-sm font-medium transition-colors',
              selected
                ? 'bg-jid-olive text-primary-foreground shadow-sm'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted/60',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
