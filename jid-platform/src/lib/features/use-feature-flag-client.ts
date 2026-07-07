'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { FeatureFlagKey } from '@/lib/features/feature-flag-keys'

const FEATURE_FLAG_STALE_MS = 5 * 60 * 1000

async function fetchFeatureFlag(key: FeatureFlagKey): Promise<boolean> {
  try {
    const supabase = createClient()
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

/** Client hook — TanStack Query with 5-minute staleTime; fails closed on error. */
export function useFeatureFlag(key: FeatureFlagKey) {
  return useQuery({
    queryKey: ['feature-flag', key],
    queryFn: () => fetchFeatureFlag(key),
    staleTime: FEATURE_FLAG_STALE_MS,
    gcTime: FEATURE_FLAG_STALE_MS,
    retry: false,
  })
}
