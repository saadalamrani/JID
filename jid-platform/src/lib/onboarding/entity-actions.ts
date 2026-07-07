'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { mergeEntitySetupSmartLinks } from '@/lib/onboarding/entity-smart-links'
import { inviteEntityTeamMembers } from '@/lib/entity/invite-team'
import {
  entitySetupSchema,
  entityTeamInvitesSchema,
  type EntitySetupValues,
  type EntityTeamInvitesValues,
} from '@/lib/validations/entity-onboarding'
import type { OnboardingActionResult } from '@/lib/onboarding/actions'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(supabase: SupabaseClient<Database>): UntypedClient {
  return supabase as unknown as UntypedClient
}

async function requireEntityAdmin(): Promise<{
  supabase: SupabaseClient<Database>
  userId: string
  companyId: string
  smartLinks: Record<string, unknown>
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('onboarding.errors.notAuthenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, smart_links')
    .eq('id', user.id)
    .maybeSingle()

  if (
    !profile ||
    (profile.role !== 'company_admin' && profile.role !== 'university_admin')
  ) {
    throw new Error('onboarding.errors.notAuthenticated')
  }

  const { data: company } = await asUntyped(supabase)
    .from('companies')
    .select('id')
    .eq('claimed_by', user.id)
    .eq('entity_state', 'approved')
    .maybeSingle()

  if (!company) {
    throw new Error('onboarding.errors.notAuthenticated')
  }

  const row = profile as { smart_links?: Record<string, unknown> }
  return {
    supabase,
    userId: user.id,
    companyId: String((company as { id: string }).id),
    smartLinks:
      row.smart_links && typeof row.smart_links === 'object' ? row.smart_links : {},
  }
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** Task 1-ALT — enrich existing catalog entity (never creates a duplicate). */
export async function saveEntityProfile(input: EntitySetupValues): Promise<OnboardingActionResult> {
  const parsed = entitySetupSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'onboarding.errors.saveFailed' }
  }

  const { supabase, userId, companyId, smartLinks } = await requireEntityAdmin()
  const now = new Date().toISOString()

  const { error: companyError } = await asUntyped(supabase)
    .from('companies')
    .update({
      logo_url: emptyToNull(parsed.data.logo_url),
      cover_url: emptyToNull(parsed.data.cover_url),
      description_ar: emptyToNull(parsed.data.description_ar),
      description_en: emptyToNull(parsed.data.description_en),
      updated_at: now,
    })
    .eq('id', companyId)
    .eq('claimed_by', userId)

  if (companyError) {
    return { ok: false, error: 'onboarding.errors.saveFailed' }
  }

  const { error: profileError } = await asUntyped(supabase)
    .from('profiles')
    .update({
      smart_links: mergeEntitySetupSmartLinks(smartLinks, { current_step: 'team' }),
      updated_at: now,
    })
    .eq('id', userId)

  if (profileError) {
    return { ok: false, error: 'onboarding.errors.saveFailed' }
  }

  redirect('/company/entity/team')
}

/** Task 2 — up to 3 team invites (staff_invitations pattern). */
export async function saveEntityTeamInvites(
  input: EntityTeamInvitesValues,
): Promise<OnboardingActionResult> {
  const parsed = entityTeamInvitesSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'onboarding.errors.saveFailed' }
  }

  const { supabase, userId, companyId, smartLinks } = await requireEntityAdmin()
  const now = new Date().toISOString()

  const uniqueEmails = [...new Set(parsed.data.invites.map((email) => email.toLowerCase()))]

  if (uniqueEmails.length > 0) {
    const inviteResult = await inviteEntityTeamMembers({
      supabase,
      companyId,
      invitedBy: userId,
      emails: uniqueEmails,
    })
    if (!inviteResult.ok) {
      return { ok: false, error: inviteResult.error }
    }
  }

  const { error } = await asUntyped(supabase)
    .from('profiles')
    .update({
      smart_links: mergeEntitySetupSmartLinks(smartLinks, {
        current_step: 'complete',
        team_step_saved_at: now,
      }),
      onboarding_completed_at: now,
      onboarding_skipped_at: null,
      updated_at: now,
    })
    .eq('id', userId)

  if (error) {
    return { ok: false, error: 'onboarding.errors.completeFailed' }
  }

  redirect('/dashboard')
}
