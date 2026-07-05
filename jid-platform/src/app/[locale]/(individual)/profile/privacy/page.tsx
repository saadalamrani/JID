import { redirect } from 'next/navigation'
import { IndividualPrivacyForm } from '@/components/profile/forms/individual-privacy-form'
import { fetchProfileRawById, getCurrentViewer } from '@/lib/profile/queries'

export default async function IndividualProfilePrivacyPage() {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    redirect('/login')
  }

  const profile = await fetchProfileRawById(viewer.userId)
  if (!profile) {
    redirect('/login')
  }

  return <IndividualPrivacyForm profile={profile} />
}
