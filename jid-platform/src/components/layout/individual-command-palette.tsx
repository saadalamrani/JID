'use client'

import { useTranslations } from 'next-intl'
import {
  INDIVIDUAL_QUICK_ACTIONS,
  PUBLIC_GUEST_QUICK_ACTIONS,
} from '@/lib/navigation/individual-quick-actions'
import { SharedCommandPalette } from '@/components/shared/command-palette'

type IndividualCommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isAuthenticated: boolean
}

/** Part 6 — individual/public command palette (client-filtered quick actions). */
export function IndividualCommandPalette({
  open,
  onOpenChange,
  isAuthenticated,
}: IndividualCommandPaletteProps) {
  const t = useTranslations('smartHeader.commandPalette')

  const quickActions = isAuthenticated
    ? INDIVIDUAL_QUICK_ACTIONS
    : [...INDIVIDUAL_QUICK_ACTIONS, ...PUBLIC_GUEST_QUICK_ACTIONS]

  return (
    <SharedCommandPalette
      open={open}
      onOpenChange={onOpenChange}
      placeholder={t('placeholder')}
      quickActionsHeading={t('quickActions')}
      quickActions={quickActions}
      getActionLabel={(key) => t(`actions.${key}` as 'actions.profile')}
      getGroupHeading={() => ''}
      searchingMessage={t('searching')}
      noResultsMessage={t('noResults')}
    />
  )
}
