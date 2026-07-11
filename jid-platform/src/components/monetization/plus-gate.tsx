'use client'

import { useEffect, type ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { JidPlusFeatureKey } from '@/lib/monetization/feature-keys'
import { useEntitlement } from '@/lib/monetization/use-entitlement'
import { cn } from '@/lib/utils'
import { PlusTeaser } from './plus-teaser'

type PlusGateProps = {
  feature: JidPlusFeatureKey
  children: ReactNode
  fallback?: ReactNode
  /** Optional blurred preview passed through to the default teaser. */
  teaserPreview?: ReactNode
  className?: string
}

/**
 * Universal Plus gate (Prompt 0) — UX layer only; security is RLS + RPC.
 */
export function PlusGate({ feature, children, fallback, teaserPreview, className }: PlusGateProps) {
  const { enabled, isLoading } = useEntitlement(feature)

  useEffect(() => {
    if (isLoading || enabled) return
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', 'plus_gate_teaser_viewed', { feature_key: feature })
    }
  }, [enabled, feature, isLoading])

  if (isLoading) {
    return (
      <div
        className={cn('space-y-3 rounded-xl border border-border bg-card p-5', className)}
        aria-busy="true"
        aria-live="polite"
      >
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-10 w-32" />
      </div>
    )
  }

  if (enabled) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <PlusTeaser
      feature={feature}
      className={className}
      preview={teaserPreview}
      onUpgradeViewed={() => {
        if (typeof window === 'undefined') return
        if (process.env.NODE_ENV === 'development') {
          console.debug('[analytics]', 'plus_gate_upgrade_clicked', { feature_key: feature })
        }
      }}
    />
  )
}
