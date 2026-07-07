import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { trackServer } from '@/lib/analytics/server'
import { resolveEntityResumePath } from '@/lib/onboarding/entity-resume'
import { resolveIndividualResumePath } from '@/lib/onboarding/resume'
import {
  isOnboardingFinished,
  resolveWelcomeDestination,
} from '@/lib/onboarding/welcome-router'
import type { UserRole } from '@/lib/auth/rbac'
import type { EntityOnboardingProfile } from '@/lib/onboarding/entity-resume'
import type { IndividualOnboardingProfile } from '@/lib/onboarding/resume'

/** Section 10 — corrected welcome router (redirect-only; no Section 10.1 UI). */
export default async function WelcomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  await trackServer('onboarding_welcome_viewed', user.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'role, full_name, phone, university_id, graduation_year, smart_links, target_sectors, onboarding_completed_at, onboarding_skipped_at',
    )
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/login')
  }

  const snapshot = profile as IndividualOnboardingProfile & { role: UserRole }

  if (isOnboardingFinished(snapshot)) {
    redirect('/dashboard')
  }

  if (snapshot.role === 'individual') {
    redirect(resolveIndividualResumePath(snapshot))
  }

  if (snapshot.role === 'company_admin' || snapshot.role === 'university_admin') {
    const entityProfile: EntityOnboardingProfile = {
      smart_links: snapshot.smart_links,
      onboarding_completed_at: snapshot.onboarding_completed_at,
      onboarding_skipped_at: snapshot.onboarding_skipped_at,
    }
    redirect(resolveEntityResumePath(entityProfile))
  }

  redirect(resolveWelcomeDestination(snapshot.role))
}
