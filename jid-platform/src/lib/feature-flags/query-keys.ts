import type { FlagKey } from '@/lib/feature-flags/keys'

export const FEATURE_FLAG_STALE_MS = 5 * 60 * 1000
export const FEATURE_FLAG_GC_MS = 10 * 60 * 1000

export const FEATURE_FLAG_AUTH_QUERY_KEY = ['feature-flag-auth'] as const

export function featureFlagQueryKey(
  key: FlagKey,
  userId: string | null,
  role: string | null,
) {
  return ['feature-flag', key, userId, role] as const
}

/** Prefix for invalidating every cached variant of a flag (all users/roles). */
export function featureFlagQueryKeyPrefix(key: string) {
  return ['feature-flag', key] as const
}
