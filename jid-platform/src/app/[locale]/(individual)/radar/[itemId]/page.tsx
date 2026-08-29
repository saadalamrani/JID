import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import {
  listCareerItemNotes,
  resolveCareerItemForUser,
  CareerOperationsError,
} from '@/lib/career-operations/service'
import { RadarItemWorkspace } from '@/components/radar/radar-item-workspace'

type RadarItemPageProps = {
  params: { itemId: string }
}

export default async function RadarItemPage({ params }: RadarItemPageProps) {
  const userId = await requireAuthenticatedUser()
  try {
    const item = await resolveCareerItemForUser(userId, params.itemId)
    const notes = await listCareerItemNotes(userId, item.id)
    return (
      <main className="container-jid py-8">
        <RadarItemWorkspace item={item} notes={notes} />
      </main>
    )
  } catch (error) {
    if (error instanceof CareerOperationsError && error.status === 404) {
      notFound()
    }
    throw error
  }
}

export async function generateMetadata() {
  const t = await getTranslations('radar')
  return { title: t('title') }
}
