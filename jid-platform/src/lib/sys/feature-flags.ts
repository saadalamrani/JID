import 'server-only'

import {
  featureFlagCategorySchema,
  featureFlagSchema,
  userOverridesSchema,
  type FeatureFlag,
  type FeatureFlagCategory,
} from '@/lib/governance/schemas'
import { createClient } from '@/lib/supabase/server'

export const FEATURE_FLAG_CATEGORY_ORDER: FeatureFlagCategory[] = [
  'modules',
  'platform',
  'pulse',
]

export type FeatureFlagsByCategory = Record<FeatureFlagCategory, FeatureFlag[]>

function parseUserOverrides(raw: unknown): FeatureFlag['user_overrides'] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const parsed = userOverridesSchema.safeParse(raw)
  return parsed.success ? parsed.data : {}
}

function mapFeatureFlagRow(row: Record<string, unknown>): FeatureFlag {
  return featureFlagSchema.parse({
    ...row,
    category: row.category ?? 'modules',
    enabled_for_roles: Array.isArray(row.enabled_for_roles) ? row.enabled_for_roles : [],
    user_overrides: parseUserOverrides(row.user_overrides),
  })
}

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('category', { ascending: true })
    .order('key', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapFeatureFlagRow(row as Record<string, unknown>))
}

export function groupFeatureFlagsByCategory(flags: FeatureFlag[]): FeatureFlagsByCategory {
  const grouped: FeatureFlagsByCategory = {
    modules: [],
    platform: [],
    pulse: [],
  }

  for (const flag of flags) {
    const category = featureFlagCategorySchema.safeParse(flag.category)
    if (category.success) {
      grouped[category.data].push(flag)
    }
  }

  return grouped
}

export async function fetchFeatureFlagByKey(key: string): Promise<FeatureFlag | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('key', key)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return mapFeatureFlagRow(data as Record<string, unknown>)
}

export type UserOverrideRow = {
  user_id: string
  full_name: string | null
  enabled: boolean
}

export async function fetchUserOverrideRows(
  overrides: FeatureFlag['user_overrides'],
): Promise<UserOverrideRow[]> {
  const entries = Object.entries(overrides)
  if (entries.length === 0) return []

  const supabase = await createClient()
  const userIds = entries.map(([userId]) => userId)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  if (error) throw new Error(error.message)

  const nameById = new Map((data ?? []).map((row) => [row.id, row.full_name]))

  return entries.map(([userId, enabled]) => ({
    user_id: userId,
    full_name: nameById.get(userId) ?? null,
    enabled,
  }))
}

export async function resolveUserIdByEmail(email: string): Promise<string | null> {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('full_name', `%${trimmed}%`)
    .limit(1)
    .maybeSingle()

  if (!error && data?.id) return data.id

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    })
    if (usersError) return null
    const match = usersData.users.find((user) => user.email?.toLowerCase() === trimmed)
    return match?.id ?? null
  } catch {
    return null
  }
}
