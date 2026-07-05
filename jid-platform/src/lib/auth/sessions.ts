import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

export type ActiveSessionRow = {
  id: string
  device_label: string | null
  ip_address: string | null
  user_agent: string | null
  last_active_at: string
  created_at: string
  expires_at: string
  revoked_at: string | null
}

export async function fetchActiveSessions(supabase: Client): Promise<ActiveSessionRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const { data, error } = await supabase
    .from('active_sessions')
    .select('id, device_label, ip_address, user_agent, last_active_at, created_at, expires_at, revoked_at')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .order('last_active_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ActiveSessionRow[]
}

export async function revokeActiveSession(supabase: Client, sessionId: string) {
  const { error } = await supabase.rpc('revoke_active_session', { p_session_id: sessionId })
  if (error) throw new Error(error.message)
}

async function hashSessionToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function recordActiveSessionFromBrowser(supabase: Client) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) return

  const tokenHash = await hashSessionToken(session.access_token)
  const expiresAt = session.expires_at
    ? new Date(session.expires_at * 1000).toISOString()
    : undefined

  await supabase.rpc('record_active_session', {
    p_session_token_hash: tokenHash,
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    p_device_label: 'Web browser',
    p_expires_at: expiresAt,
  })
}
