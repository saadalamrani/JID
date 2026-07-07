import 'server-only'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import {
  canAccessIndividualStep,
  resolveIndividualResumePath,
  type IndividualOnboardingProfile,
  type IndividualOnboardingStep,
} from '@/lib/onboarding/resume'
import { isOnboardingFinished } from '@/lib/onboarding/welcome-router'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(supabase: SupabaseClient<Database>): UntypedClient {
  return supabase as unknown as UntypedClient
}

const ONBOARDING_PROFILE_SELECT = `
  id,
  role,
  full_name,
  phone,
  university_id,
  graduation_year,
  target_sectors,
  smart_links,
  onboarding_completed_at,
  onboarding_skipped_at
` as const

export async function fetchIndividualOnboardingProfile(
  userId: string,
): Promise<IndividualOnboardingProfile | null> {
  const supabase = await createClient()
  const { data, error } = await asUntyped(supabase)
    .from('profiles')
    .select(ONBOARDING_PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const row = data as Record<string, unknown>
  return {
    full_name: (row.full_name as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    university_id: (row.university_id as string | null) ?? null,
    graduation_year: (row.graduation_year as number | null) ?? null,
    target_sectors: (row.target_sectors as string[]) ?? [],
    smart_links: (row.smart_links as Record<string, unknown> | null) ?? null,
    onboarding_completed_at: (row.onboarding_completed_at as string | null) ?? null,
    onboarding_skipped_at: (row.onboarding_skipped_at as string | null) ?? null,
  }
}

export async function requireIndividualOnboardingUser(): Promise<{
  userId: string
  profile: IndividualOnboardingProfile
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await fetchIndividualOnboardingProfile(user.id)
  if (!profile) {
    redirect('/login')
  }

  return { userId: user.id, profile }
}

export async function guardIndividualOnboardingStep(step: IndividualOnboardingStep): Promise<{
  userId: string
  profile: IndividualOnboardingProfile
}> {
  const { userId, profile } = await requireIndividualOnboardingUser()

  if (isOnboardingFinished(profile)) {
    redirect('/dashboard')
  }

  if (!canAccessIndividualStep(profile, step)) {
    redirect(resolveIndividualResumePath(profile))
  }

  return { userId, profile }
}
