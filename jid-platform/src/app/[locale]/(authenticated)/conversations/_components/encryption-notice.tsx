'use client'

import { Shield } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import type { DecryptedMessage } from '@/types/conversation'

const NOTICE_PREFIX = 'jid-e2e-notice-seen:'

type EncryptionNoticeProps = {
  conversationId: string
  otherUserName: string
}

export function buildEncryptionSystemMessage(
  conversationId: string,
  otherUserName: string,
  locale: string,
): DecryptedMessage {
  const text =
    locale === 'en'
      ? `Messages are end-to-end encrypted. Only you and ${otherUserName} can read them.`
      : `الرسائل مشفّرة من طرف إلى طرف. أنت و${otherUserName} فقط من يمكنهما قراءتها.`

  return {
    id: `system-e2e-${conversationId}`,
    conversation_id: conversationId,
    sender_id: 'system',
    message_type: 'text',
    meeting_id: null,
    ciphertext: null,
    nonce: null,
    created_at: new Date().toISOString(),
    plaintext: text,
    decryptState: 'ready',
    isSystem: true,
  }
}

export function EncryptionNotice({ conversationId, otherUserName }: EncryptionNoticeProps) {
  const t = useTranslations('conversations.chat')
  const locale = useLocale()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const key = `${NOTICE_PREFIX}${conversationId}`
    const seen = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : '1'
    setVisible(!seen)
  }, [conversationId])

  if (!visible) return null

  return (
    <div className="mx-4 mb-4 rounded-xl border border-jid-olive/30 bg-jid-olive/5 px-4 py-3">
      <div className="flex gap-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-jid-olive" aria-hidden />
        <div className="min-w-0">
          <p className="font-arabic text-sm font-medium text-jid-ink">{t('encryptionNoticeTitle')}</p>
          <p className="mt-1 font-arabic text-xs text-jid-ink/65">
            {buildEncryptionSystemMessage(conversationId, otherUserName, locale).plaintext}
          </p>
          <button
            type="button"
            className="mt-2 font-arabic text-xs font-medium text-jid-olive hover:underline"
            onClick={() => {
              localStorage.setItem(`${NOTICE_PREFIX}${conversationId}`, '1')
              setVisible(false)
            }}
          >
            {t('encryptionNoticeDismiss')}
          </button>
        </div>
      </div>
    </div>
  )
}
