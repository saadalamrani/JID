import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type EmergencyActionRow = {
  id: string
  action_type: string
  reason: string
  is_active: boolean
  activated_at: string
  activated_by: string
  deactivated_at: string | null
  deactivated_by: string | null
  reverted_at: string | null
  reverted_by: string | null
  activator_name: string | null
  reverter_name: string | null
}

export async function fetchEmergencyHistory(limit = 20): Promise<EmergencyActionRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('emergency_actions')
    .select(
      `
      id,
      action_type,
      reason,
      is_active,
      activated_at,
      activated_by,
      deactivated_at,
      deactivated_by,
      reverted_at,
      reverted_by
    `,
    )
    .order('activated_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  const rows = data ?? []
  const profileIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.activated_by, row.reverted_by])
        .filter((id): id is string => Boolean(id)),
    ),
  )

  const nameById = new Map<string, string | null>()
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', profileIds)

    for (const profile of profiles ?? []) {
      nameById.set(profile.id, profile.full_name)
    }
  }

  return rows.map((row) => ({
    id: row.id,
    action_type: row.action_type,
    reason: row.reason,
    is_active: row.is_active,
    activated_at: row.activated_at,
    activated_by: row.activated_by,
    deactivated_at: row.deactivated_at,
    deactivated_by: row.deactivated_by,
    reverted_at: row.reverted_at,
    reverted_by: row.reverted_by,
    activator_name: nameById.get(row.activated_by) ?? null,
    reverter_name: row.reverted_by ? (nameById.get(row.reverted_by) ?? null) : null,
  }))
}

export async function fetchActiveEmergency(actionType: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('emergency_actions')
    .select('id, action_type, reason, activated_at')
    .eq('action_type', actionType)
    .eq('is_active', true)
    .order('activated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}
