import 'server-only'

import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type MaintenanceConfigValue = {
  enabled: boolean
  message: string | null
}

export type PlatformGates = {
  maintenance: MaintenanceConfigValue
  registrationsOpen: boolean
}

const DEFAULT_GATES: PlatformGates = {
  maintenance: { enabled: false, message: null },
  registrationsOpen: true,
}

function parseMaintenanceValue(value: unknown): MaintenanceConfigValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { enabled: false, message: null }
  }
  const record = value as Record<string, unknown>
  return {
    enabled: Boolean(record.enabled),
    message: typeof record.message === 'string' ? record.message : null,
  }
}

function parseRegistrationsOpen(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === true) return true
  if (value === 'false' || value === false) return false
  return true
}

async function fetchPlatformGatesUncached(): Promise<PlatformGates> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('platform_config')
      .select('key, value')
      .in('key', ['maintenance_mode', 'registrations_open'])

    if (error || !data) return DEFAULT_GATES

    let maintenance = DEFAULT_GATES.maintenance
    let registrationsOpen = true

    for (const row of data) {
      if (row.key === 'maintenance_mode') {
        maintenance = parseMaintenanceValue(row.value)
      }
      if (row.key === 'registrations_open') {
        registrationsOpen = parseRegistrationsOpen(row.value)
      }
    }

    return { maintenance, registrationsOpen }
  } catch {
    return DEFAULT_GATES
  }
}

/** Server components — 30s stale-while-revalidate. */
export const getCachedPlatformGates = unstable_cache(
  fetchPlatformGatesUncached,
  ['platform-gates'],
  { revalidate: 30 },
)

export async function getPlatformGates(): Promise<PlatformGates> {
  return getCachedPlatformGates()
}

/** Edge/middleware — in-memory TTL cache (30s). */
let middlewareCache: { gates: PlatformGates; fetchedAt: number } | null = null
const MIDDLEWARE_TTL_MS = 30_000

export async function getMiddlewarePlatformGates(): Promise<PlatformGates> {
  if (middlewareCache && Date.now() - middlewareCache.fetchedAt < MIDDLEWARE_TTL_MS) {
    return middlewareCache.gates
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return DEFAULT_GATES
  }

  try {
    const response = await fetch(
      `${url}/rest/v1/platform_config?key=in.(maintenance_mode,registrations_open)&select=key,value`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        next: { revalidate: 30 },
      },
    )

    if (!response.ok) {
      return DEFAULT_GATES
    }

    const rows = (await response.json()) as Array<{ key: string; value: unknown }>
    let maintenance = DEFAULT_GATES.maintenance
    let registrationsOpen = true

    for (const row of rows) {
      if (row.key === 'maintenance_mode') maintenance = parseMaintenanceValue(row.value)
      if (row.key === 'registrations_open') registrationsOpen = parseRegistrationsOpen(row.value)
    }

    const gates = { maintenance, registrationsOpen }
    middlewareCache = { gates, fetchedAt: Date.now() }
    return gates
  } catch {
    return DEFAULT_GATES
  }
}

export function invalidateMiddlewarePlatformGatesCache() {
  middlewareCache = null
}
