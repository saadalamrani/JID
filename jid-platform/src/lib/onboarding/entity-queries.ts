import 'server-only'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { UserRole } from '@/lib/auth/rbac'
import {
  canAccessEntityStep,
  resolveEntityResumePath,
  type EntityOnboardingProfile,
  type EntitySetupStep,
} from '@/lib/onboarding/entity-resume'
import { isOnboardingFinished } from '@/lib/onboarding/welcome-router'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(supabase: SupabaseClient<Database>): UntypedClient {
  return supabase as unknown as UntypedClient
}

export type ClaimedEntityRecord = {
  id: string
  name: string
  name_ar: string | null
  entity_type: string
  entity_state: string
  logo_url: string | null
  cover_url: string | null
  description_ar: string | null
  description_en: string | null
  tagline_ar: string | null
  tagline_en: string | null
}

const ENTITY_ADMIN_ROLES: UserRole[] = ['company_admin', 'university_admin']

export type EntityOnboardingContext = {
  userId: string
  role: UserRole
  profile: EntityOnboardingProfile
  company: ClaimedEntityRecord
}

export async function fetchClaimedEntityForUser(userId: string): Promise<ClaimedEntityRecord | null> {
  const supabase = await createClient()
  const { data, error } = await asUntyped(supabase)
    .from('companies')
    .select(
      'id, name, name_ar, entity_type, entity_state, logo_url, cover_url, description_ar, description_en, tagline_ar, tagline_en',
    )
    .eq('claimed_by', userId)
    .eq('entity_state', 'approved')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as unknown as ClaimedEntityRecord
}

export async function guardEntityOnboardingStep(step: EntitySetupStep): Promise<EntityOnboardingContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileRow } = await asUntyped(supabase)
    .from('profiles')
    .select('role, smart_links, onboarding_completed_at, onboarding_skipped_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!profileRow) {
    redirect('/login')
  }

  const role = profileRow.role as UserRole
  if (!ENTITY_ADMIN_ROLES.includes(role)) {
    redirect('/dashboard')
  }

  const profile: EntityOnboardingProfile = {
    smart_links: (profileRow.smart_links as Record<string, unknown> | null) ?? null,
    onboarding_completed_at: (profileRow.onboarding_completed_at as string | null) ?? null,
    onboarding_skipped_at: (profileRow.onboarding_skipped_at as string | null) ?? null,
  }

  if (isOnboardingFinished(profile)) {
    redirect('/dashboard')
  }

  if (!canAccessEntityStep(profile, step)) {
    redirect(resolveEntityResumePath(profile))
  }

  const company = await fetchClaimedEntityForUser(user.id)
  if (!company) {
    redirect('/dashboard')
  }

  return { userId: user.id, role, profile, company }
}
