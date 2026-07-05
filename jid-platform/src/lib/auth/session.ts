import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { isUserRole, type UserRole } from './rbac'

export type SessionProfile = {
  id: string
  role: UserRole
  full_name: string | null
  email_verified_at: string | null
  phone_verified_at: string | null
  locked_until: string | null
  mfa_enabled: boolean
  mfa_enforced: boolean
  locale: string
}

export type SessionWithProfile = {
  userId: string
  email: string | undefined
  profile: SessionProfile
}

const PROFILE_COLUMNS =
  'id, role, full_name, email_verified_at, phone_verified_at, locked_until, mfa_enabled, mfa_enforced, locale' as const

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

export function isProfileSuspended(profile: SessionProfile): boolean {
  if (!profile.locked_until) return false
  return new Date(profile.locked_until).getTime() > Date.now()
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

export type BrowserSupabase = SupabaseClient<Database>

export async function fetchProfileForUser(
  supabase: BrowserSupabase,
  userId: string,
): Promise<SessionProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle()

  if (error || !data || !isUserRole(data.role)) return null
  return data
}
