'use client'

import { Suspense, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { BadgePill } from '@/components/profile/badge-pill'
import type { EarnedUserBadge } from '@/lib/profile/types'

export function BadgeDisplayFallback() {
  return (
    <div className="flex flex-wrap gap-2" aria-busy="true" aria-label="Loading badges">
      <Skeleton className="h-7 w-24 rounded-full" />
      <Skeleton className="h-7 w-28 rounded-full" />
      <Skeleton className="h-7 w-20 rounded-full" />
    </div>
  )
}

type BadgeDisplayListProps = {
  badges: EarnedUserBadge[]
  locale?: 'ar' | 'en'
  emptyMessage?: string
}

export function BadgeDisplayList({ badges, locale = 'ar', emptyMessage }: BadgeDisplayListProps) {
  const t = useTranslations('profile.components')

  if (badges.length === 0) {
    return (
      <p className="text-sm text-jid-ink/50">{emptyMessage ?? t('badgesEmpty')}</p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <BadgePill key={badge.id} badge={badge} locale={locale} />
      ))}
    </div>
  )
}

type BadgeDisplayProps = {
  /** Wrap async badge resolution — does not block initial paint (Section 13). */
  children: ReactNode
}

export function BadgeDisplay({ children }: BadgeDisplayProps) {
  return <Suspense fallback={<BadgeDisplayFallback />}>{children}</Suspense>
}

type BadgeDisplayStaticProps = {
  badges: EarnedUserBadge[]
  locale?: 'ar' | 'en'
  loading?: boolean
}

/** Synchronous badge row when data is already available (e.g. previews). */
export function BadgeDisplayStatic({ badges, locale, loading }: BadgeDisplayStaticProps) {
  if (loading) return <BadgeDisplayFallback />
  return <BadgeDisplayList badges={badges} locale={locale} />
}
