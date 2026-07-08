'use client'

import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EmptyState } from '@/components/shared/empty-state'

/** Visual shell for zero-completion profiles (Section 6.3 empty state). */
export function ProfileEmptyState() {
  const t = useTranslations('profile.public')

  return (
    <EmptyState
      icon={Sparkles}
      variant="inline"
      title={t('emptyStateTitle')}
      description={t('emptyStateMessage')}
    />
  )
}
