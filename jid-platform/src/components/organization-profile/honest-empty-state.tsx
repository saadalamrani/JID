'use client'

import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

type HonestEmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export function HonestEmptyState({ title, description, action }: HonestEmptyStateProps) {
  const t = useTranslations('organizationProfile.emptyState')

  return (
    <div className="rounded-lg border border-border/70 bg-background px-4 py-6 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-foreground/65">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      <p className="sr-only">{t('noFabricatedData')}</p>
    </div>
  )
}
