'use client'

import { useEffect, type ReactNode } from 'react'
import type { JidPlusFeatureKey } from '@/lib/monetization/feature-keys'
import { useEntitlement } from '@/lib/monetization/use-entitlement'
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
        className={className}
        aria-busy="true"
        aria-live="polite"
      />
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
