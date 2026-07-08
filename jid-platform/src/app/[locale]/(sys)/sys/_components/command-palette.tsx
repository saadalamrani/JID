'use client'

import { useTranslations } from 'next-intl'
import { SYS_QUICK_ACTIONS } from '@/lib/sys/nav'
import {
  SharedCommandPalette,
  useCommandPaletteHotkey,
} from '@/components/shared/command-palette'

import type { SysSearchResponse } from '@/types/sys-search'

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Section 9 — global command palette (Cmd+K / Ctrl+K). */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const t = useTranslations('sys.commandPalette')

  return (
    <SharedCommandPalette
      open={open}
      onOpenChange={onOpenChange}
      placeholder={t('placeholder')}
      quickActionsHeading={t('quickActions')}
      quickActions={SYS_QUICK_ACTIONS}
      getActionLabel={(key) => t(`actions.${key}` as 'actions.dashboard')}
      getGroupHeading={(key) => t(`groups.${key}` as 'groups.users')}
      searchingMessage={t('searching')}
      noResultsMessage={t('noResults')}
      fetchSearchGroups={async (query, signal) => {
        const response = await fetch(`/sys/search?q=${encodeURIComponent(query)}`, {
          credentials: 'same-origin',
          signal,
        })

        if (!response.ok) {
          return []
        }

        const data = (await response.json()) as SysSearchResponse
        return [
          { key: 'users', items: data.users },
          { key: 'entities', items: data.entities },
        ].filter((group) => group.items.length > 0)
      }}
    />
  )
}

export { useCommandPaletteHotkey as useSysCommandPaletteHotkey }
