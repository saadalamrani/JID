import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { SysSearchResponse } from '@/types/sys-search'

const RESULT_LIMIT = 8
const MIN_QUERY_LENGTH = 2

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

export async function searchSysDirectory(query: string): Promise<SysSearchResponse> {
  const trimmed = query.trim()
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return { users: [], entities: [] }
  }

  const pattern = `%${escapeIlike(trimmed)}%`
  const supabase = await createClient()

  const [usersResult, entitiesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .ilike('full_name', pattern)
      .order('full_name', { ascending: true })
      .limit(RESULT_LIMIT),
    supabase
      .from('companies')
      .select('id, name, name_ar, entity_type')
      .or(`name.ilike.${pattern},name_ar.ilike.${pattern}`)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(RESULT_LIMIT),
  ])

  const users =
    usersResult.data?.map((row) => ({
      id: row.id,
      label: row.full_name?.trim() || 'Unnamed user',
      subtitle: row.role,
      href: `/u/${row.id}`,
    })) ?? []

  const entities =
    entitiesResult.data?.map((row) => ({
      id: row.id,
      label: row.name_ar?.trim() || row.name,
      subtitle: row.entity_type,
      href: `/companies/${row.id}`,
    })) ?? []

  return { users, entities }
}
