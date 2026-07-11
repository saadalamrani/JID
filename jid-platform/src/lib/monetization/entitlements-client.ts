'use client'

import { createClient } from '@/lib/supabase/client'
import { isModel1FeatureKey } from './feature-keys'
import type { UserEntitlement } from './types'

export async function fetchMyEntitlements(): Promise<UserEntitlement[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_my_entitlements')

  if (error) {
    throw new Error(error.message)
  }

  const rows: UserEntitlement[] = []

  for (const row of data ?? []) {
    if (!isModel1FeatureKey(row.feature_key)) continue
    rows.push({ featureKey: row.feature_key, quota: row.quota ?? null })
  }

  return rows
}
