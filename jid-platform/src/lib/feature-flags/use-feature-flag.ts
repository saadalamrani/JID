'use client'

import { useQueries, useQuery } from '@tanstack/react-query'
import type { FlagKey } from '@/lib/feature-flags/keys'
import {
  FEATURE_FLAG_AUTH_QUERY_KEY,
  FEATURE_FLAG_GC_MS,
  FEATURE_FLAG_STALE_MS,
  featureFlagQueryKey,
} from '@/lib/feature-flags/query-keys'
import { createClient } from '@/lib/supabase/client'

type FeatureFlagAuthContext = {
  userId: string | null
  role: string | null
}

async function resolveFeatureFlagAuthContext(): Promise<FeatureFlagAuthContext> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { userId: null, role: null }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return { userId: user.id, role: null }
  }

  return { userId: user.id, role: profile.role }
}

/** Fail-closed: loads session + role, then evaluates `is_feature_enabled`. */
async function fetchFeatureFlagEnabled(key: FlagKey): Promise<boolean> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) return false

    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) return false
    }

    const { data, error } = await supabase.rpc('is_feature_enabled', {
      p_flag_key: key,
    })

    if (error || data == null) return false
    return data === true
  } catch {
    return false
  }
}

function useFeatureFlagAuthContext() {
  return useQuery({
    queryKey: FEATURE_FLAG_AUTH_QUERY_KEY,
    queryFn: resolveFeatureFlagAuthContext,
    staleTime: FEATURE_FLAG_STALE_MS,
    gcTime: FEATURE_FLAG_GC_MS,
    retry: false,
  })
}

const sharedQueryOptions = {
  staleTime: FEATURE_FLAG_STALE_MS,
  gcTime: FEATURE_FLAG_GC_MS,
  retry: false,
} as const

/** Client hook — TanStack Query with 5m stale / 10m gc; fails closed on error. */
export function useFeatureFlag(key: FlagKey) {
  const authQuery = useFeatureFlagAuthContext()
  const userId = authQuery.data?.userId ?? null
  const role = authQuery.data?.role ?? null

  const flagQuery = useQuery({
    queryKey: featureFlagQueryKey(key, userId, role),
    queryFn: () => fetchFeatureFlagEnabled(key),
    enabled: authQuery.isSuccess,
    ...sharedQueryOptions,
  })

  const isLoading = authQuery.isLoading || (authQuery.isSuccess && flagQuery.isLoading)
  const isError = authQuery.isError || flagQuery.isError
  const isEnabled = flagQuery.isSuccess ? (flagQuery.data ?? false) : false

  return {
    ...flagQuery,
    isLoading,
    isError,
    isEnabled,
    data: isEnabled,
  }
}

export function useFeatureFlags<const K extends FlagKey>(keys: readonly K[]) {
  const authQuery = useFeatureFlagAuthContext()
  const userId = authQuery.data?.userId ?? null
  const role = authQuery.data?.role ?? null

  const flagQueries = useQueries({
    queries: keys.map((key) => ({
      queryKey: featureFlagQueryKey(key, userId, role),
      queryFn: () => fetchFeatureFlagEnabled(key),
      enabled: authQuery.isSuccess,
      ...sharedQueryOptions,
    })),
  })

  const isLoading =
    authQuery.isLoading || (authQuery.isSuccess && flagQueries.some((query) => query.isLoading))
  const isError = authQuery.isError || flagQueries.some((query) => query.isError)

  const flags = Object.fromEntries(
    keys.map((key, index) => [key, flagQueries[index]?.isSuccess ? (flagQueries[index]?.data ?? false) : false]),
  ) as { [P in K]: boolean }

  return {
    flags,
    isLoading,
    isError,
    queries: flagQueries,
  }
}
