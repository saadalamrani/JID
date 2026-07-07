import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { FeatureFlagKey } from '@/lib/features/feature-flag-keys'

/** Section 13 — fail CLOSED: missing row or query error → false (never true). */
export async function getFeatureFlag(key: FeatureFlagKey): Promise<boolean> {
  noStore()
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('feature_flags')
      .select('is_enabled')
      .eq('key', key)
      .maybeSingle()

    if (error || !data) return false
    return data.is_enabled === true
  } catch {
    return false
  }
}

type PlatformPulseGuardProps = {
  flag: FeatureFlagKey
  children: ReactNode
  /** Optional fallback when the flag is off (default: render nothing). */
  fallback?: ReactNode
}

/** Server component — renders children only when the flag is enabled. */
export async function PlatformPulseGuard({ flag, children, fallback = null }: PlatformPulseGuardProps) {
  const enabled = await getFeatureFlag(flag)
  return enabled ? children : fallback
}
