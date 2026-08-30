import { redirect } from 'next/navigation'
import { IndividualPrivacyForm } from '@/components/profile/forms/individual-privacy-form'
import { SourcingInvitationsPanel } from '@/components/profile/sourcing-invitations-panel'
import { fetchProfileRawById, getCurrentViewer } from '@/lib/profile/queries'
import { listMySourcingInvitations } from '@/lib/talent-sourcing/service'

export default async function IndividualProfilePrivacyPage() {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    redirect('/login')
  }

  const profile = await fetchProfileRawById(viewer.userId)
  if (!profile) {
    redirect('/login')
  }

  let invitations: Awaited<ReturnType<typeof listMySourcingInvitations>> = []
  try {
    invitations = await listMySourcingInvitations()
  } catch {
    invitations = []
  }

  return (
    <div className="space-y-8 pb-12">
      <IndividualPrivacyForm profile={profile} />
      <div className="container-jid max-w-2xl">
        <SourcingInvitationsPanel invitations={invitations} />
      </div>
    </div>
  )
}
