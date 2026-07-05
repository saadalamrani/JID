import { redirect } from 'next/navigation'
import { IndividualProfileEditForm } from '@/components/profile/forms/individual-profile-edit-form'
import {
  fetchOwnProfilePageContext,
  fetchProfileSkillIds,
  fetchSkillsCatalog,
  getCurrentViewer,
} from '@/lib/profile/queries'

export default async function IndividualProfileEditPage({
  searchParams,
}: {
  searchParams: { focus?: string }
}) {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    redirect('/login')
  }

  const context = await fetchOwnProfilePageContext()
  if (!context) {
    redirect('/login')
  }

  const [skillsCatalog, skillIds] = await Promise.all([
    fetchSkillsCatalog(),
    fetchProfileSkillIds(viewer.userId),
  ])

  return (
    <IndividualProfileEditForm
      context={context}
      skillsCatalog={skillsCatalog}
      skillIds={skillIds}
      focus={searchParams.focus ?? null}
    />
  )
}
