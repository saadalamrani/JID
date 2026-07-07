import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { FeatureFlagKey } from '@/lib/features/feature-flag-keys'

const FEATURE_FLAG_STALE_MS = 5 * 60 * 1000

async function fetchFeatureFlagClient(key: FeatureFlagKey): Promise<boolean> {
  try {
    const supabase = createBrowserClient()
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

/** Section 4.2 — server utility (fail-closed). */
export async function getFeatureFlag(key: FeatureFlagKey): Promise<boolean> {
  if (typeof window !== 'undefined') {
    return fetchFeatureFlagClient(key)
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
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

/** Section 4.2 — client hook using TanStack Query (fail-closed). */
export function useFeatureFlag(key: FeatureFlagKey) {
  return useQuery({
    queryKey: ['feature-flag', key],
    queryFn: () => fetchFeatureFlagClient(key),
    staleTime: FEATURE_FLAG_STALE_MS,
    gcTime: FEATURE_FLAG_STALE_MS,
    retry: false,
  })
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
