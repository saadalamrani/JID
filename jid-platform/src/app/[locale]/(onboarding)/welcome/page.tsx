import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveIndividualResumePath } from '@/lib/onboarding/resume'
import {
  isOnboardingFinished,
  resolveWelcomeDestination,
} from '@/lib/onboarding/welcome-router'
import type { UserRole } from '@/lib/auth/rbac'
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

  redirect(resolveWelcomeDestination(snapshot.role))
}
