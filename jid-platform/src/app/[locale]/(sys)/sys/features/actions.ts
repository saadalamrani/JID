'use server'

import { revalidatePath } from 'next/cache'
import type { FeatureFlagKey } from '@/lib/features/feature-flag-keys'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdminActor, type SysActionResult } from '@/lib/sys/sys-actions-shared'

export type PulseFeatureActionResult = SysActionResult

function revalidateFeaturesPath() {
  revalidatePath('/sys/features')
}

export async function updatePulseFeatureFlag(
  key: FeatureFlagKey,
  isEnabled: boolean,
): Promise<PulseFeatureActionResult> {
  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const supabase = await createClient()
  const { error } = await supabase
    .from('feature_flags')
    .update({
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
      updated_by: actor.userId,
    })
    .eq('key', key)

  if (error) return { ok: false, error: error.message }

  revalidateFeaturesPath()
  return { ok: true }
}

export async function updateMetricThresholdMin(
  metricKey: string,
  minValue: number,
): Promise<PulseFeatureActionResult> {
  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  if (!Number.isFinite(minValue) || minValue < 0) {
    return { ok: false, error: 'Minimum value must be a non-negative number' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('metric_thresholds')
    .update({
      min_value: minValue,
      updated_at: new Date().toISOString(),
    })
    .eq('metric_key', metricKey)

  if (error) return { ok: false, error: error.message }

  revalidateFeaturesPath()
  return { ok: true }
}
