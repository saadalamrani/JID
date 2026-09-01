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
import { fetchOwnedDirectoryForUser } from '@/lib/entity/owned-directory'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(supabase: SupabaseClient<Database>): UntypedClient {
  return supabase as unknown as UntypedClient
}

export type OwnedEntityRecord = {
  id: string
  name: string
  name_ar: string | null
  entity_type: string
  is_verified: boolean
  logo_url: string | null
  cover_url: string | null
  description_ar: string | null
  description_en: string | null
  tagline_ar: string | null
  tagline_en: string | null
}

/** @deprecated Use OwnedEntityRecord */
export type ClaimedEntityRecord = OwnedEntityRecord

const ENTITY_ADMIN_ROLES: UserRole[] = ['company_admin', 'university_admin']

export type EntityOnboardingContext = {
  userId: string
  role: UserRole
  profile: EntityOnboardingProfile
  company: OwnedEntityRecord
}

export async function fetchOwnedEntityForUser(userId: string): Promise<OwnedEntityRecord | null> {
  const owned = await fetchOwnedDirectoryForUser(userId)
  if (!owned) return null
  return {
    id: owned.id,
    name: owned.name,
    name_ar: owned.name_ar,
    entity_type: owned.entity_type,
    is_verified: owned.is_verified,
    logo_url: owned.logo_url,
    cover_url: owned.cover_url,
    description_ar: owned.description_ar,
    description_en: owned.description_en,
    tagline_ar: owned.tagline_ar,
    tagline_en: owned.tagline_en,
  }
}

/** @deprecated Use fetchOwnedEntityForUser */
export const fetchClaimedEntityForUser = fetchOwnedEntityForUser

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

  const company = await fetchOwnedEntityForUser(user.id)
  if (!company) {
    redirect('/dashboard')
  }

  return { userId: user.id, role, profile, company }
}
