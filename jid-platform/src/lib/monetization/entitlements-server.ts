import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Model1FeatureKey } from './feature-keys'
import { isModel1FeatureKey } from './feature-keys'
import type { UserEntitlement } from './types'

export async function fetchMyEntitlementsServer(): Promise<UserEntitlement[]> {
  const supabase = await createClient()
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

/** Current-user entitlement check — JID Plus features (SECURITY DEFINER RPC). */
export async function userHasEntitlement(feature: Model1FeatureKey): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('has_entitlement', { p_feature: feature })

  if (error) {
    return false
  }

  return Boolean(data)
}

/** Company entitlement check — employer features (SECURITY DEFINER RPC). */
export async function companyHasEntitlement(
  companyId: string,
  feature: Model1FeatureKey,
): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('company_has_entitlement', {
    p_company_id: companyId,
    p_feature: feature,
  })

  if (error) {
    return false
  }

  return Boolean(data)
}
