'use client'

import { useTranslations } from 'next-intl'
import { STAFF_QUICK_ACTIONS } from '@/lib/staff/constants'
import {
  SharedCommandPalette,
  useCommandPaletteHotkey,
} from '@/components/shared/command-palette'

import type { StaffSearchResponse } from '@/types/staff-search'

type StaffCommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Section 6 / 12 — bounded staff command palette (Cmd+K / Ctrl+K). */
export function StaffCommandPalette({ open, onOpenChange }: StaffCommandPaletteProps) {
  const t = useTranslations('staff.commandPalette')

  return (
    <SharedCommandPalette
      open={open}
      onOpenChange={onOpenChange}
      placeholder={t('placeholder')}
      quickActionsHeading={t('quickActions')}
      quickActions={STAFF_QUICK_ACTIONS}
      getActionLabel={(key) => t(`actions.${key}` as 'actions.dashboard')}
      getGroupHeading={(key) => t(`groups.${key}` as 'groups.users')}
      searchingMessage={t('searching')}
      noResultsMessage={t('noResults')}
      fetchSearchGroups={async (query, signal) => {
        const response = await fetch(`/staff/search?q=${encodeURIComponent(query)}`, {
          credentials: 'same-origin',
          signal,
        })

        if (!response.ok) {
          return []
        }

        const data = (await response.json()) as StaffSearchResponse
        return [
          { key: 'users', items: data.users },
          { key: 'entities', items: data.entities },
          { key: 'claims', items: data.claims },
        ].filter((group) => group.items.length > 0)
      }}
    />
  )
}

export { useCommandPaletteHotkey as useStaffCommandPaletteHotkey }
