'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { LAMMAH_OPPORTUNITY_TYPES, type LammahOpportunityType } from '@/types/lammah'

type LammahOpportunityTypeChipsProps = {
  selected: LammahOpportunityType[]
  onChange: (value: LammahOpportunityType[]) => void
}

export function LammahOpportunityTypeChips({
  selected,
  onChange,
}: LammahOpportunityTypeChipsProps) {
  const t = useTranslations('opportunities.lammah.opportunityTypes')

  return (
    <div className="space-y-2">
      <p className="text-foreground-400 font-arabic text-xs font-medium">{t('label')}</p>
      <div className="flex flex-wrap gap-2">
        {LAMMAH_OPPORTUNITY_TYPES.map((type) => {
          const isSelected = selected.includes(type)

          return (
            <button
              key={type}
              type="button"
              onClick={() =>
                onChange(
                  isSelected ? selected.filter((value) => value !== type) : [...selected, type],
                )
              }
              aria-pressed={isSelected}
              className={cn(
                'rounded-full border px-3 py-1.5 font-arabic text-sm transition-colors',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:border-primary/25 border-border bg-card text-foreground',
              )}
            >
              {t(type)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
