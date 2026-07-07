import { FLAG_KEYS } from '@/lib/feature-flags/keys'

let cache: { enabled: boolean; fetchedAt: number } | null = null
const TTL_MS = 30_000

/** Edge/middleware — fail CLOSED when flag row is missing or unreachable. */
export async function getMiddlewarePulsePublicEnabled(): Promise<boolean> {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return cache.enabled
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    cache = { enabled: false, fetchedAt: Date.now() }
    return false
  }

  try {
    const response = await fetch(
      `${url}/rest/v1/feature_flags?key=eq.${FLAG_KEYS.PULSE_PUBLIC}&select=is_enabled`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      },
    )

    if (!response.ok) {
      cache = { enabled: false, fetchedAt: Date.now() }
      return false
    }

    const rows = (await response.json()) as Array<{ is_enabled: boolean }>
    const enabled = rows[0]?.is_enabled === true
    cache = { enabled, fetchedAt: Date.now() }
    return enabled
  } catch {
    cache = { enabled: false, fetchedAt: Date.now() }
    return false
  }
}

export function invalidateMiddlewarePulsePublicCache() {
  cache = null
}

export function isPulsePath(pathname: string): boolean {
  return /^(?:\/(?:ar|en))?\/pulse(?:\/|$)/.test(pathname)
}
