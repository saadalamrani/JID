import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchUserConversations } from '@/lib/conversations/queries'
import { ConversationsList } from './_components/conversations-list'
import { getTranslations } from 'next-intl/server'

export default async function ConversationsPage() {
  const userId = await requireAuthenticatedUser()
  const conversations = await fetchUserConversations(userId)
  const t = await getTranslations('conversations.list')

  return (
    <main className="container-jid py-8">
      <header className="mb-6">
        <h1 className="font-arabic text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-1 font-arabic text-sm text-jid-ink/60">{t('subtitle')}</p>
      </header>
      <ConversationsList conversations={conversations} />
    </main>
  )
}

export async function generateMetadata() {
  return { title: 'Conversations' }
}
