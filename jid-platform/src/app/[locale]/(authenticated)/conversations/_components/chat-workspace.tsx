'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { ChatInputBar } from './chat-input-bar'
import { ConversationOpenedTracker } from './conversation-opened-tracker'
import { EncryptionNotice, buildEncryptionSystemMessage } from './encryption-notice'
import { MessageBubble } from './message-bubble'
import { ScheduleBubbleMessage } from './schedule-bubble-message'
import { useRealtimeMessages } from '@/lib/hooks/use-realtime-messages'
import type { ConversationDetail, ConversationMessageRow } from '@/types/conversation'
import type { MeetingSummary } from '@/types/meeting'

type ChatWorkspaceProps = {
  conversation: ConversationDetail
  userId: string
  initialMessages: ConversationMessageRow[]
}

export function ChatWorkspace({ conversation, userId, initialMessages }: ChatWorkspaceProps) {
  const t = useTranslations('conversations.chat')
  const locale = useLocale()
  const bottomRef = useRef<HTMLDivElement>(null)
  const otherName = conversation.other_user.full_name?.trim() || t('unnamed')
  const isMentor = userId === conversation.mentor_id

  const { messages, appendOptimistic, updateMeetingOnMessage } = useRealtimeMessages({
    conversationId: conversation.id,
    userId,
    initialMessages,
  })

  const systemMessage = useMemo(
    () => buildEncryptionSystemMessage(conversation.id, otherName, locale),
    [conversation.id, locale, otherName],
  )

  const displayMessages = useMemo(() => {
    const hasSystem = messages.some((item) => item.isSystem)
    if (hasSystem) return messages
    return [systemMessage, ...messages]
  }, [messages, systemMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages.length])

  function handleMeetingUpdated(meeting: MeetingSummary) {
    updateMeetingOnMessage(meeting.id, meeting)
  }

  return (
    <div className="flex min-h-[70vh] flex-col rounded-xl border border-jid-line bg-jid-beige/20 shadow-sm">
      <ConversationOpenedTracker conversationId={conversation.id} />
      <header className="flex items-center gap-3 border-b border-jid-line bg-white px-4 py-3">
        <Link href="/conversations" className="font-arabic text-sm text-jid-olive hover:underline">
          {t('back')}
        </Link>
        <ProfileAvatar
          src={conversation.other_user.avatar_url}
          alt={otherName}
          size="sm"
          variant="circle"
        />
        <div className="min-w-0">
          <h1 className="truncate font-arabic text-base font-semibold text-jid-ink">{otherName}</h1>
          <p className="font-arabic text-xs text-jid-ink/50">{t('encryptedSubtitle')}</p>
        </div>
      </header>

      <EncryptionNotice conversationId={conversation.id} otherUserName={otherName} />

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {displayMessages.map((message) =>
          message.message_type === 'schedule_proposal' ? (
            <ScheduleBubbleMessage
              key={message.id}
              meeting={message.meeting}
              isOwn={message.sender_id === userId}
              viewerId={userId}
              onMeetingUpdated={handleMeetingUpdated}
            />
          ) : (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={!message.isSystem && message.sender_id === userId}
            />
          ),
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInputBar
        conversationId={conversation.id}
        userId={userId}
        recipientUserId={conversation.other_user.id}
        isMentor={isMentor}
        onSent={appendOptimistic}
      />
    </div>
  )
}
