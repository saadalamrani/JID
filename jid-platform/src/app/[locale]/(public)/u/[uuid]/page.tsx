import { notFound } from 'next/navigation'
import { ProfilePrivateGate } from '@/components/profile/profile-private-gate'
import { ProfileViewTracker } from '@/components/profile/profile-view-tracker'
import { IndividualProfileView } from '@/components/profile/individual-profile-view'
import { ProfileBadgesAsync } from '@/components/profile/profile-badges-async'
import { SuspendedAdminView } from '@/components/profile/suspended-admin-view'
import { getCurrentViewer, fetchProfilePageContext, stripSensitiveProfileFields } from '@/lib/profile/queries'
import {
  canViewerSeeProfile,
  isPrivilegedStaffRole,
} from '@/lib/profile/visibility-rules'

type IndividualProfilePageProps = {
  params: { uuid: string }
}

function isProfileSuspended(profile: {
  suspended_at: string | null
  profile_state: string
}): boolean {
  return Boolean(profile.suspended_at) || profile.profile_state === 'suspended'
}

export default async function IndividualProfilePage({ params }: IndividualProfilePageProps) {
  const { uuid } = params
  const viewer = await getCurrentViewer()
  const context = await fetchProfilePageContext(uuid)

  if (!context) {
    notFound()
  }

  const { profile } = context

  if (profile.deleted_at || profile.profile_state === 'deleted') {
    notFound()
  }

  if (isProfileSuspended(profile)) {
    if (!viewer.isAdmin && !isPrivilegedStaffRole(viewer.role)) {
      notFound()
    }
    return <SuspendedAdminView context={context} profile={profile} />
  }

  if (!canViewerSeeProfile(viewer, profile)) {
    return <ProfilePrivateGate />
  }

  const isOwner = viewer.userId === profile.id
  const isHrViewer =
    (viewer.role as string) === 'company_admin' && viewer.isVerified && !isOwner

  const isMentorViewer = viewer.isMentorApproved && !isOwner && !isHrViewer

  const sanitizedContext = {
    ...context,
    profile: stripSensitiveProfileFields(context.profile, viewer),
  }

  return (
    <>
      {isHrViewer && viewer.companyId ? (
        <ProfileViewTracker profileId={profile.id} companyId={viewer.companyId} />
      ) : null}
      <IndividualProfileView
        context={sanitizedContext}
        badges={[]}
        isOwner={isOwner}
        isHrViewer={isHrViewer}
        isMentorViewer={isMentorViewer}
        badgeSlot={<ProfileBadgesAsync userId={profile.id} />}
      />
    </>
  )
}

export async function generateMetadata({ params }: IndividualProfilePageProps) {
  const viewer = await getCurrentViewer()
  const context = await fetchProfilePageContext(params.uuid)
  if (!context) {
    return { title: 'Profile' }
  }

  const { profile } = context
  if (profile.deleted_at || profile.profile_state === 'deleted') {
    return { title: 'Profile' }
  }
  if (isProfileSuspended(profile) && !viewer.isAdmin && !isPrivilegedStaffRole(viewer.role)) {
    return { title: 'Profile' }
  }
  if (!canViewerSeeProfile(viewer, profile)) {
    return { title: 'Profile' }
  }

  return {
    title: profile.full_name ?? 'Profile',
  }
}
