import { notFound, redirect } from 'next/navigation'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchCandidateInvitation } from '@/lib/ssis/queries'
import { ScreeningSessionClient } from './_components/screening-session-client'

type PageProps = {
  params: Promise<{ invitationId: string }>
}

export default async function ScreeningInvitationPage({ params }: PageProps) {
  const userId = await requireAuthenticatedUser()
  const { invitationId } = await params

  const data = await fetchCandidateInvitation(invitationId, userId)
  if (!data) notFound()

  const { invitation, screening, blocks } = data

  if (blocks.length === 0) {
    redirect('/radar')
  }

  return (
    <main className="container-jid max-w-2xl py-8">
      <header className="mb-6">
        <h1 className="font-arabic text-2xl font-semibold text-foreground">فحص أولي</h1>
        <p className="mt-1 font-arabic text-sm text-muted-foreground">
          {screening.generation_context.job.title_ar}
        </p>
      </header>

      <ScreeningSessionClient invitation={invitation} screening={screening} blocks={blocks} />
    </main>
  )
}

export async function generateMetadata() {
  return { title: 'Smart Screening' }
}
