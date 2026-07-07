import 'server-only'

import { unstable_cache } from 'next/cache'
import { ALL_FLAG_KEYS, type FlagKey } from '@/lib/feature-flags/keys'
import { createClient } from '@/lib/supabase/server'

export type IsFeatureEnabledOptions = {
  /** When true, bypass the 60s unstable_cache layer (e.g. immediately after admin toggle). */
  bypassCache?: boolean
}

async function fetchFeatureEnabledUncached(key: FlagKey): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('is_feature_enabled', {
      p_flag_key: key,
    })

    if (error || data == null) return false
    return data === true
  } catch {
    return false
  }
}

const cachedFlagReaders = Object.fromEntries(
  ALL_FLAG_KEYS.map((key) => [
    key,
    unstable_cache(() => fetchFeatureEnabledUncached(key), ['feature-flag', key], {
      revalidate: 60,
      tags: [`flag:${key}`],
    }),
  ]),
) as Record<FlagKey, () => Promise<boolean>>

/** Fail-closed: any error or missing row → false. Cached for 60s with per-flag tag. */
export async function isFeatureEnabled(
  key: FlagKey,
  options?: IsFeatureEnabledOptions,
): Promise<boolean> {
  if (options?.bypassCache) {
    return fetchFeatureEnabledUncached(key)
  }

  return cachedFlagReaders[key]()
}

export async function areFeaturesEnabled<const K extends FlagKey>(
  keys: readonly K[],
): Promise<{ [P in K]: boolean }> {
  const results = await Promise.all(keys.map((key) => isFeatureEnabled(key)))
  return Object.fromEntries(keys.map((key, index) => [key, results[index]])) as {
    [P in K]: boolean
  }
}
