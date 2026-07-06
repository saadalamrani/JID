import { notFound } from 'next/navigation'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import {
  fetchConversationById,
  fetchConversationMessages,
} from '@/lib/conversations/queries'
import { ChatWorkspace } from '../_components/chat-workspace'

type ConversationPageProps = {
  params: { conversationId: string }
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const userId = await requireAuthenticatedUser()
  const conversation = await fetchConversationById(params.conversationId, userId)

  if (!conversation) {
    notFound()
  }

  const messages = await fetchConversationMessages(conversation.id)

  return (
    <main className="container-jid py-8">
      <ChatWorkspace
        conversation={conversation}
        userId={userId}
        initialMessages={messages}
      />
    </main>
  )
}

export async function generateMetadata() {
  return { title: 'Conversation' }
}
