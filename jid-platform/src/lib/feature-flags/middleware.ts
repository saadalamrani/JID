import type { FlagKey } from '@/lib/feature-flags/keys'

const TTL_MS = 30_000
const cache = new Map<string, { enabled: boolean; fetchedAt: number }>()

/** Edge/middleware — fail CLOSED via `is_feature_enabled` RPC. */
export async function getMiddlewareFeatureEnabled(key: FlagKey): Promise<boolean> {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return cached.enabled
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    cache.set(key, { enabled: false, fetchedAt: Date.now() })
    return false
  }

  try {
    const response = await fetch(`${url}/rest/v1/rpc/is_feature_enabled`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_flag_key: key }),
    })

    if (!response.ok) {
      cache.set(key, { enabled: false, fetchedAt: Date.now() })
      return false
    }

    const enabled = (await response.json()) === true
    cache.set(key, { enabled, fetchedAt: Date.now() })
    return enabled
  } catch {
    cache.set(key, { enabled: false, fetchedAt: Date.now() })
    return false
  }
}

export function isMentorshipDiscoveryPath(pathname: string): boolean {
  return /^(?:\/(?:ar|en))?\/(?:mentorship|mentors)(?:\/|$)/.test(pathname)
}
