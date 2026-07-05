import type { SupabaseClient } from '@supabase/supabase-js'
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

export const PROFILE_COLUMNS =
  'id, role, full_name, email_verified_at, phone_verified_at, locked_until, mfa_enabled, mfa_enforced, locale' as const

export type BrowserSupabase = SupabaseClient<Database>

export function isProfileSuspended(profile: SessionProfile): boolean {
  if (!profile.locked_until) return false
  return new Date(profile.locked_until).getTime() > Date.now()
}

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
