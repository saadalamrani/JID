'use client'

import { Link } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import type { ConversationListItem } from '@/types/conversation'

type ConversationsListProps = {
  conversations: ConversationListItem[]
}

export function ConversationsList({ conversations }: ConversationsListProps) {
  const t = useTranslations('conversations.list')

  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-jid-line bg-white px-6 py-16 text-center">
        <p className="font-arabic text-sm font-medium text-jid-ink">{t('emptyTitle')}</p>
        <p className="mt-2 font-arabic text-sm text-jid-ink/55">{t('emptyBody')}</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-jid-line overflow-hidden rounded-xl border border-jid-line bg-white shadow-sm">
      {conversations.map((conversation) => {
        const name = conversation.other_user.full_name?.trim() || t('unnamed')
        return (
          <li key={conversation.id}>
            <Link
              href={`/conversations/${conversation.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-jid-beige/40"
            >
              <ProfileAvatar
                src={conversation.other_user.avatar_url}
                alt={name}
                size="sm"
                variant="circle"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-arabic text-sm font-medium text-jid-ink">{name}</p>
                <p className="font-arabic text-xs text-jid-ink/50">
                  {conversation.last_message_at
                    ? new Date(conversation.last_message_at).toLocaleString()
                    : t('noMessagesYet')}
                </p>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
