import { redirect } from 'next/navigation'
import { IndividualProfileView } from '@/components/profile/individual-profile-view'
import { ProfileBadgesAsync } from '@/components/profile/profile-badges-async'
import {
  fetchOwnProfilePageContext,
  getCurrentViewer,
} from '@/lib/profile/queries'

export default async function IndividualOwnerProfilePage() {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    redirect('/login')
  }

  const context = await fetchOwnProfilePageContext()
  if (!context) {
    redirect('/login')
  }

  return (
    <IndividualProfileView
      context={context}
      badges={[]}
      isOwner
      isHrViewer={false}
      isMentorViewer={false}
      badgeSlot={<ProfileBadgesAsync userId={viewer.userId} />}
    />
  )
}
