import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type SysStaffMemberDetail = {
  id: string
  full_name: string | null
  role: string
  created_at: string
  last_login_at: string | null
  mfa_enabled: boolean
  suspended_at: string | null
}

export async function fetchSysStaffMember(staffId: string): Promise<SysStaffMemberDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at, last_login_at, mfa_enabled, suspended_at')
    .eq('id', staffId)
    .in('role', ['staff', 'admin', 'super_admin'])
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return data
}
