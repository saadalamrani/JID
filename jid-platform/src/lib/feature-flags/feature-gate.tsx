import type { ReactElement, ReactNode } from 'react'
import { getLocale } from 'next-intl/server'
import { FeatureUnavailable } from '@/lib/feature-flags/feature-unavailable'
import type { FlagKey } from '@/lib/feature-flags/keys'
import { getFlagMetadata } from '@/lib/feature-flags/metadata'
import { isFeatureEnabled } from '@/lib/feature-flags/server'

type FeatureGateProps = {
  flag: FlagKey
  children: ReactNode
  fallback?: ReactNode
  compact?: boolean
}

/** Server Component — renders children only when the module flag is enabled. */
export async function FeatureGate({
  flag,
  children,
  fallback,
  compact,
}: FeatureGateProps): Promise<ReactElement | null> {
  const enabled = await isFeatureEnabled(flag)

  if (enabled) {
    return <>{children}</>
  }

  if (fallback !== undefined) {
    return <>{fallback}</>
  }

  const locale = await getLocale()
  const metadata = getFlagMetadata(flag)
  const title = locale === 'ar' ? metadata.labelAr : metadata.labelEn
  const message = locale === 'ar' ? metadata.fallbackMessageAr : metadata.fallbackMessageEn

  return <FeatureUnavailable title={title} message={message} compact={compact} />
}
