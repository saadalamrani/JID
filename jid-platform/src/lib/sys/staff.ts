import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

export type ValidatedInvite = {
  invitation_id: string
  email: string
  invite_role: Database['public']['Enums']['user_role_enum']
}

export async function validateStaffInviteToken(
  supabase: Client,
  token: string,
): Promise<ValidatedInvite | null> {
  const { data, error } = await supabase.rpc('validate_staff_invite_token', {
    p_token: token,
  })

  if (error) throw new Error(error.message)

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.invitation_id) return null

  return row as ValidatedInvite
}

export async function completeStaffInviteAcceptance(supabase: Client, token: string) {
  const { error } = await supabase.rpc('complete_staff_invite_acceptance', {
    p_token: token,
  })

  if (error) throw new Error(error.message)
}

export async function fetchStaffDirectory(supabase: Client) {
  const { data: staff, error: staffError } = await supabase
    .from('profiles')
    .select('id, full_name, role, email_verified_at, created_at')
    .in('role', ['staff', 'admin', 'super_admin'])
    .order('created_at', { ascending: false })

  if (staffError) throw new Error(staffError.message)

  const { data: pending, error: pendingError } = await supabase
    .from('staff_invitations')
    .select('id, email, role, reason, expires_at, created_at, invited_by')
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (pendingError) throw new Error(pendingError.message)

  return { staff: staff ?? [], pendingInvitations: pending ?? [] }
}
