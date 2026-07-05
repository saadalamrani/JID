'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { siteConfig } from '@/config/site'
import {
  buildAcceptInviteUrl,
  generateInviteToken,
  getInviteExpiryIso,
  hashInviteToken,
} from '@/lib/sys/invite-token'
import type { InviteStaffFormValues } from '@/lib/validations/sys'

export type InviteStaffResult =
  | { ok: true; invitationId: string }
  | { ok: false; error: string }

export async function inviteStaffMember(input: InviteStaffFormValues): Promise<InviteStaffResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, error: 'Authentication required' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'super_admin') {
    return { ok: false, error: 'Only super administrators can invite staff' }
  }

  const plainToken = generateInviteToken()
  const tokenHash = hashInviteToken(plainToken)
  const email = input.email.trim().toLowerCase()

  const { data: invitation, error: insertError } = await supabase
    .from('staff_invitations')
    .insert({
      email,
      role: 'staff',
      invite_token: tokenHash,
      invited_by: user.id,
      expires_at: getInviteExpiryIso(),
      reason: input.reason.trim(),
    })
    .select('id')
    .single()

  if (insertError || !invitation) {
    return { ok: false, error: insertError?.message ?? 'Failed to create invitation' }
  }

  try {
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'staff.invited',
      entity_type: 'staff_invitation',
      entity_id: invitation.id,
      new_data: {
        email,
        role: 'staff',
        reason: input.reason.trim(),
      },
      metadata: { source: 'sys_portal' },
    })
  } catch {
    return { ok: false, error: 'Invitation created but audit log failed' }
  }

  const inviteUrl = buildAcceptInviteUrl(siteConfig.appUrl, plainToken)
  const { error: emailError } = await supabase.functions.invoke('send-staff-invite', {
    body: {
      email,
      inviteUrl,
      reason: input.reason.trim(),
    },
  })

  if (emailError) {
    return { ok: false, error: `Invitation saved but email failed: ${emailError.message}` }
  }

  return { ok: true, invitationId: invitation.id }
}
