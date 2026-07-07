import 'server-only'

import {
  platformConfigCategorySchema,
  platformConfigRowSchema,
  platformConfigValueTypeSchema,
  type PlatformConfigCategory,
  type PlatformConfigRow,
} from '@/lib/sys/platform-config'
import { createClient } from '@/lib/supabase/server'

export type PlatformConfigByCategory = Record<PlatformConfigCategory, PlatformConfigRow[]>

function mapRow(row: Record<string, unknown>): PlatformConfigRow {
  return platformConfigRowSchema.parse({
    ...row,
    category: row.category ?? 'platform',
    value_type: row.value_type ?? 'json',
  })
}

export async function fetchPlatformConfigRows(): Promise<PlatformConfigRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('platform_config')
    .select('*')
    .order('category', { ascending: true })
    .order('key', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>))
}

export async function fetchPlatformConfigByKey(key: string): Promise<PlatformConfigRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('platform_config').select('*').eq('key', key).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return mapRow(data as Record<string, unknown>)
}

export function groupPlatformConfigByCategory(rows: PlatformConfigRow[]): PlatformConfigByCategory {
  const grouped: PlatformConfigByCategory = {
    platform: [],
    security: [],
    operations: [],
    integrations: [],
  }

  for (const row of rows) {
    const category = platformConfigCategorySchema.safeParse(row.category)
    if (category.success) {
      grouped[category.data].push(row)
    } else {
      grouped.platform.push(row)
    }
  }

  return grouped
}

export function displayConfigValue(row: PlatformConfigRow, revealSecret = false): string {
  if (row.is_secret && !revealSecret) return '••••••••'
  const valueType = platformConfigValueTypeSchema.parse(row.value_type)
  if (valueType === 'json') return JSON.stringify(row.value)
  return String(row.value ?? '')
}
