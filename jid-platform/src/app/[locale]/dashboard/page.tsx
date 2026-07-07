import { redirect } from 'next/navigation'
import { getPortalHomeForRole } from '@/lib/auth/portal-routes'
import type { UserRole } from '@/lib/auth/rbac'
import { createClient } from '@/lib/supabase/server'

/** Unified post-onboarding entry — forwards to the role-specific portal home. */
export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/login')
  }

  redirect(getPortalHomeForRole(profile.role as UserRole))
}
