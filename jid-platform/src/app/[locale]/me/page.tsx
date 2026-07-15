import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Compatibility entry for the individual portal and approved mentor hub. */
export default async function IndividualPortalEntryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (mentorProfile?.status === 'approved') {
    redirect('/mentor/dashboard')
  }

  redirect('/profile')
}
