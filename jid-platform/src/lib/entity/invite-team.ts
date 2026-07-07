import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { siteConfig } from '@/config/site'
import {
  generateInviteToken,
  getInviteExpiryIso,
  hashInviteToken,
} from '@/lib/sys/invite-token'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(supabase: SupabaseClient<Database>): UntypedClient {
  return supabase as unknown as UntypedClient
}

export type InviteEntityTeamResult = { ok: true } | { ok: false; error: string }

/**
 * Task 2 — entity team invites using the same token/TTL pattern as staff_invitations.
 * Email delivery: TODO(send-entity-team-invite) — records are persisted even when email is skipped.
 */
export async function inviteEntityTeamMembers(input: {
  supabase: SupabaseClient<Database>
  companyId: string
  invitedBy: string
  emails: string[]
}): Promise<InviteEntityTeamResult> {
  const client = asUntyped(input.supabase)
  const expiresAt = getInviteExpiryIso()

  for (const email of input.emails) {
    const plainToken = generateInviteToken()
    const tokenHash = hashInviteToken(plainToken)

    const { error } = await client.from('entity_team_invitations').insert({
      company_id: input.companyId,
      email,
      invite_token: tokenHash,
      invited_by: input.invitedBy,
      expires_at: expiresAt,
    })

    if (error) {
      return { ok: false, error: 'onboarding.entity.errors.inviteFailed' }
    }

    const inviteUrl = `${siteConfig.appUrl}/signup?team_invite=${encodeURIComponent(plainToken)}`
    if (process.env.NODE_ENV === 'development') {
      console.info(`[entity-team-invite] Queued invite for ${email}: ${inviteUrl}`)
    }
    // TODO(send-entity-team-invite): invoke edge function when email template ships.
  }

  return { ok: true }
}
