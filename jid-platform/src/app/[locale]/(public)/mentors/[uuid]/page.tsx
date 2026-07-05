import { notFound } from 'next/navigation'
import { MentorPendingStaffBanner } from '@/components/profile/mentor-pending-staff-banner'
import { MentorProfileView } from '@/components/profile/mentor-profile-view'
import { RecentReviews } from '@/components/profile/recent-reviews'
import { fetchUserBadges } from '@/lib/profile/badge-helpers'
import { fetchMentorPageContext, getCurrentViewer } from '@/lib/profile/queries'
import { isPrivilegedStaffRole } from '@/lib/profile/visibility-rules'
import { createClient } from '@/lib/supabase/server'

type MentorProfilePageProps = {
  params: { uuid: string }
}

function canViewMentorProfile(status: string, isStaff: boolean): boolean {
  if (status === 'approved') return true
  return isStaff
}

export default async function MentorProfilePage({ params }: MentorProfilePageProps) {
  const { uuid } = params
  const viewer = await getCurrentViewer()
  const context = await fetchMentorPageContext(uuid)

  if (!context) {
    notFound()
  }

  const { mentor } = context
  const isStaff = viewer.isAdmin || isPrivilegedStaffRole(viewer.role)

  if (!canViewMentorProfile(mentor.status, isStaff)) {
    notFound()
  }

  const isOwner = viewer.userId === mentor.user_id
  const isMentee =
    viewer.userId !== null &&
    viewer.role === 'individual' &&
    !isOwner

  const supabase = await createClient()
  const badges = await fetchUserBadges(supabase, mentor.user_id)

  const showStaffPendingBanner = mentor.status !== 'approved' && isStaff

  return (
    <div className="container-jid space-y-4 pt-8">
      {showStaffPendingBanner ? <MentorPendingStaffBanner status={mentor.status} /> : null}
      <MentorProfileView
        context={context}
        badges={badges}
        isOwner={isOwner}
        isMentee={isMentee}
        reviewsSlot={<RecentReviews mentorId={mentor.user_id} />}
      />
    </div>
  )
}

export async function generateMetadata({ params }: MentorProfilePageProps) {
  const viewer = await getCurrentViewer()
  const context = await fetchMentorPageContext(params.uuid)

  if (!context) {
    return { title: 'Mentor' }
  }

  const isStaff = viewer.isAdmin || isPrivilegedStaffRole(viewer.role)
  if (!canViewMentorProfile(context.mentor.status, isStaff)) {
    return { title: 'Mentor' }
  }

  return {
    title: context.mentor.profile.full_name ?? 'Mentor',
  }
}
