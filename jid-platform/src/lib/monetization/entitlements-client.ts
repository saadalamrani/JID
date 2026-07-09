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

  return (data ?? [])
    .map((row) => {
      if (!isModel1FeatureKey(row.feature_key)) return null
      return { featureKey: row.feature_key, quota: row.quota }
    })
    .filter((row): row is UserEntitlement => row !== null)
}
