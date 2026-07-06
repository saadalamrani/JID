import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BecomeMentorPending } from './_components/become-mentor-pending'
import { BecomeMentorWizard } from './_components/become-mentor-wizard'

const PENDING_STATUSES = new Set(['pending_review', 'pending', 'under_review'])

export default async function BecomeMentorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: mentorProfile }] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),
    supabase
      .from('mentor_profiles')
      .select('status, application_submitted_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (mentorProfile?.status === 'approved') {
    redirect('/mentor/profile')
  }

  if (mentorProfile?.status && PENDING_STATUSES.has(mentorProfile.status)) {
    return (
      <BecomeMentorPending
        status={mentorProfile.status}
        submittedAt={mentorProfile.application_submitted_at}
      />
    )
  }

  return (
    <BecomeMentorWizard
      fullName={profile?.full_name?.trim() ?? ''}
      avatarUrl={profile?.avatar_url}
    />
  )
}
