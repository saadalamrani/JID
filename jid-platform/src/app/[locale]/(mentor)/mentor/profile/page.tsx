import { notFound, redirect } from 'next/navigation'
import { MentorProfileView } from '@/components/profile/mentor-profile-view'
import { RecentReviews } from '@/components/profile/recent-reviews'
import { fetchMentorResponseStats } from '@/lib/mentor/response-stats'
import { fetchUserBadges } from '@/lib/profile/badge-helpers'
import { fetchOwnMentorPageContext, getCurrentViewer } from '@/lib/profile/queries'
import { createClient } from '@/lib/supabase/server'

export default async function MentorOwnerProfilePage() {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    redirect('/login')
  }

  const context = await fetchOwnMentorPageContext()
  if (!context) {
    notFound()
  }

  const supabase = await createClient()
  const [badges, responseStats] = await Promise.all([
    fetchUserBadges(supabase, viewer.userId),
    fetchMentorResponseStats(viewer.userId),
  ])

  return (
    <MentorProfileView
      context={context}
      badges={badges}
      isOwner
      isMentee={false}
      responseStats={responseStats}
      reviewsSlot={<RecentReviews mentorId={context.mentor.user_id} />}
    />
  )
}
