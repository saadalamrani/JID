import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { IndividualProfileWorkspace } from '@/components/profile/workspace/individual-profile-workspace'
import { IndividualRestrictedView } from '@/components/profile/workspace/individual-restricted-view'
import { ProfileViewTracker } from '@/components/profile/profile-view-tracker'
import { SuspendedAdminView } from '@/components/profile/suspended-admin-view'
import { getCurrentViewer } from '@/lib/profile/queries'
import { resolveIndividualProfilePage } from '@/lib/profile/individual-profile-projection'

type IndividualProfileRouteProps = {
  params: { profileId: string }
  searchParams: { view?: string }
}

export default async function IndividualProfileRoutePage({
  params,
  searchParams,
}: IndividualProfileRouteProps) {
  const { profileId } = params
  const viewer = await getCurrentViewer()
  const forcePublicPreview = searchParams.view === 'public'

  const resolution = await resolveIndividualProfilePage(profileId, { forcePublicPreview })

  if (resolution.status === 'not_found' || resolution.status === 'deleted') {
    notFound()
  }

  if (resolution.status === 'suspended_admin') {
    return <SuspendedAdminView context={resolution.context} profile={resolution.profile} />
  }

  const { projection } = resolution

  if (projection.viewState === 'restricted') {
    return <IndividualRestrictedView identity={projection.identity} />
  }

  const isHrViewer =
    (viewer.role as string) === 'company_admin' && viewer.isVerified && viewer.userId !== profileId

  return (
    <>
      {isHrViewer && viewer.companyId ? (
        <ProfileViewTracker profileId={profileId} companyId={viewer.companyId} />
      ) : null}
      <IndividualProfileWorkspace
        projection={projection}
        isPublicPreview={forcePublicPreview && projection.viewState === 'public'}
      />
    </>
  )
}

export async function generateMetadata({ params, searchParams }: IndividualProfileRouteProps) {
  const t = await getTranslations('profile.workspace')
  const resolution = await resolveIndividualProfilePage(params.profileId, {
    forcePublicPreview: searchParams.view === 'public',
  })

  if (resolution.status !== 'ok') {
    return { title: t('metaFallback') }
  }

  const { projection } = resolution
  if (projection.viewState === 'restricted') {
    return { title: projection.identity.fullName ?? t('metaFallback') }
  }

  return {
    title: projection.identity.fullName ?? t('metaFallback'),
  }
}
