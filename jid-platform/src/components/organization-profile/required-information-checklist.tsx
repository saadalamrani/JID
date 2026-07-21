'use client'

import { useTranslations } from 'next-intl'
import type { ProfileChecklistItem } from '@/lib/profile/organization-profile-checklist'
import { cn } from '@/lib/utils'

type RequiredInformationChecklistProps = {
  items: ProfileChecklistItem[]
  onGoToSection?: (section: string) => void
}

export function RequiredInformationChecklist({
  items,
  onGoToSection,
}: RequiredInformationChecklistProps) {
  const t = useTranslations('organizationProfile.checklist')

  return (
    <ul className="space-y-2" aria-label={t('title')}>
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            'flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm',
            item.status === 'required' && 'border-amber-200 bg-amber-50/50',
            item.status === 'added' && 'border-emerald-200 bg-emerald-50/40',
            item.status === 'optional' && 'border-border bg-background',
          )}
        >
          <div>
            <span className="font-medium text-foreground">{t(`fields.${item.id}`)}</span>
            <span className="ms-2 text-xs text-foreground/60">{t(`status.${item.status}`)}</span>
          </div>
          {onGoToSection ? (
            <button
              type="button"
              className="min-h-11 rounded-md px-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => onGoToSection(item.section)}
            >
              {t('edit')}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
