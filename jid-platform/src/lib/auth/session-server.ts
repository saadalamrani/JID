import { createClient } from '@/lib/supabase/server'
import { isUserRole } from './rbac'
import {
  PROFILE_COLUMNS,
  type SessionProfile,
  type SessionWithProfile,
} from './session'

export type { SessionProfile, SessionWithProfile } from './session'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}

export async function getCurrentProfile(userId?: string): Promise<SessionProfile | null> {
  const supabase = await createClient()
  const id = userId ?? (await getCurrentUser())?.id
  if (!id) return null

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error || !data || !isUserRole(data.role)) return null
  return data
}

export async function getSessionWithProfile(): Promise<SessionWithProfile | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const profile = await getCurrentProfile(user.id)
  if (!profile) return null

  return {
    userId: user.id,
    email: user.email,
    profile,
  }
}

export async function touchLastLogin(userId: string, ipAddress?: string | null) {
  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({
      last_login_at: new Date().toISOString(),
      last_login_ip: ipAddress ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
}
