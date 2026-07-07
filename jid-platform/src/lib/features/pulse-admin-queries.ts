import 'server-only'

import { PLATFORM_PULSE_FLAG_KEYS, type FeatureFlagKey } from '@/lib/features/feature-flag-keys'
import { createClient } from '@/lib/supabase/server'

export type PulseFeatureFlagRow = {
  key: FeatureFlagKey
  is_enabled: boolean
  label_en: string
  label_ar: string
  description_en: string | null
  description_ar: string | null
}

export type MetricThresholdRow = {
  metric_key: string
  label_en: string
  label_ar: string
  min_value: number
  current_value: number
  /** DB column `is_met` — exposed as is_displayed in the admin UI. */
  is_met: boolean
}

export async function fetchPulseFeatureFlags(): Promise<PulseFeatureFlagRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feature_flags')
    .select('key, is_enabled, label_en, label_ar, description_en, description_ar')
    .in('key', [...PLATFORM_PULSE_FLAG_KEYS])

  if (error) throw new Error(error.message)

  const byKey = new Map((data ?? []).map((row) => [row.key, row]))

  return PLATFORM_PULSE_FLAG_KEYS.map((key) => {
    const row = byKey.get(key)
    return {
      key,
      is_enabled: row?.is_enabled ?? false,
      label_en: row?.label_en ?? key,
      label_ar: row?.label_ar ?? key,
      description_en: row?.description_en ?? null,
      description_ar: row?.description_ar ?? null,
    }
  })
}

export async function fetchMetricThresholds(): Promise<MetricThresholdRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('metric_thresholds')
    .select('metric_key, label_en, label_ar, min_value, current_value, is_met')
    .order('metric_key')

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    metric_key: row.metric_key,
    label_en: row.label_en,
    label_ar: row.label_ar,
    min_value: Number(row.min_value),
    current_value: Number(row.current_value),
    is_met: row.is_met,
  }))
}
