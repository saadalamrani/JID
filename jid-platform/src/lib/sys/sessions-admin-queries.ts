import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type SysActiveSessionRow = {
  id: string
  user_id: string
  user_name: string | null
  device_label: string | null
  ip_address: string | null
  user_agent: string | null
  last_active_at: string
  created_at: string
  expires_at: string
}

export async function fetchAllActiveSessions(): Promise<SysActiveSessionRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('active_sessions')
      .select(
        `
        id,
        user_id,
        device_label,
        ip_address,
        user_agent,
        last_active_at,
        created_at,
        expires_at,
        profiles!active_sessions_user_id_fkey(full_name)
      `,
      )
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('last_active_at', { ascending: false })
      .limit(500)

    if (error) throw new Error(error.message)

    return (data ?? []).map((row) => {
      const profile = row.profiles as { full_name: string | null } | null
      return {
        id: row.id,
        user_id: row.user_id,
        user_name: profile?.full_name ?? null,
        device_label: row.device_label,
        ip_address: row.ip_address ? String(row.ip_address) : null,
        user_agent: row.user_agent,
        last_active_at: row.last_active_at,
        created_at: row.created_at,
        expires_at: row.expires_at,
      }
    })
  } catch {
    const supabase = await createClient()
    const { data } = await supabase
      .from('active_sessions')
      .select('id, user_id, device_label, ip_address, user_agent, last_active_at, created_at, expires_at')
      .is('revoked_at', null)
      .order('last_active_at', { ascending: false })
      .limit(100)

    return (data ?? []).map((row) => ({
      ...row,
      user_name: null,
      ip_address: row.ip_address ? String(row.ip_address) : null,
    }))
  }
}
