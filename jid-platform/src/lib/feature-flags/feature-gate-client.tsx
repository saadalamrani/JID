'use client'

import type { ReactNode } from 'react'
import { useLocale } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { FeatureUnavailable } from '@/lib/feature-flags/feature-unavailable'
import type { FlagKey } from '@/lib/feature-flags/keys'
import { getFlagMetadata } from '@/lib/feature-flags/metadata'
import { useFeatureFlag } from '@/lib/feature-flags/use-feature-flag'

type FeatureGateClientProps = {
  flag: FlagKey
  children: ReactNode
  fallback?: ReactNode
  compact?: boolean
  className?: string
}

function FeatureGateSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border border-accent/20 bg-surface/80 px-4 py-3"
        aria-hidden
      >
        <Skeleton className="h-9 w-9 shrink-0 rounded-full bg-background/80" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-32 bg-background/80" />
          <Skeleton className="h-3 w-full max-w-xs bg-background/70" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border border-accent/20 bg-surface/80 px-6 py-12 text-center sm:px-10 sm:py-14"
      aria-hidden
    >
      <Skeleton className="mx-auto h-14 w-14 rounded-2xl bg-background/80" />
      <Skeleton className="mx-auto mt-6 h-7 w-48 bg-background/80" />
      <Skeleton className="mx-auto mt-3 h-4 w-full max-w-md bg-background/70" />
    </div>
  )
}

/** Client gate — skeleton while loading; same fallback semantics as FeatureGate. */
export function FeatureGateClient({
  flag,
  children,
  fallback,
  compact,
  className,
}: FeatureGateClientProps) {
  const locale = useLocale()
  const { isLoading, isEnabled } = useFeatureFlag(flag)

  if (isLoading) {
    return <FeatureGateSkeleton compact={compact} />
  }

  if (isEnabled) {
    return className ? <div className={className}>{children}</div> : children
  }

  if (fallback !== undefined) {
    return fallback
  }

  const metadata = getFlagMetadata(flag)
  const title = locale === 'ar' ? metadata.labelAr : metadata.labelEn
  const message = locale === 'ar' ? metadata.fallbackMessageAr : metadata.fallbackMessageEn

  return (
    <FeatureUnavailable title={title} message={message} compact={compact} className={className} />
  )
}
