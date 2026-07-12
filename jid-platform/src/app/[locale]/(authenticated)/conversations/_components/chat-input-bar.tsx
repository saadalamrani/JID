'use client'

import { CalendarPlus, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { encryptMessage } from '@/lib/encryption/e2e'
import { getLocalPrivateKey } from '@/lib/encryption/key-storage'
import { cacheSentMessagePlaintext } from '@/lib/encryption/message-plaintext-cache'
import type { DecryptedMessage } from '@/types/conversation'
import { ScheduleMeetingDialog } from './schedule-meeting-dialog'

type ChatInputBarProps = {
  conversationId: string
  userId: string
  recipientUserId: string
  isMentor: boolean
  onSent: (message: DecryptedMessage) => void
}

async function fetchRecipientPublicKey(userId: string): Promise<string> {
  const response = await fetch(`/api/users/${userId}/encryption-key`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to load recipient encryption key')
  }
  const body = (await response.json()) as { public_key: string }
  return body.public_key
}

export function ChatInputBar({
  conversationId,
  userId,
  recipientUserId,
  isMentor,
  onSent,
}: ChatInputBarProps) {
  const t = useTranslations('conversations.chat')
  const tSchedule = useTranslations('conversations.schedule')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  async function handleSend() {
    const text = draft.trim()
    if (!text || sending) return

    setSending(true)
    try {
      const privateKey = await getLocalPrivateKey(userId)
      if (!privateKey) {
        throw new Error(t('keysMissing'))
      }

      const recipientPublicKey = await fetchRecipientPublicKey(recipientUserId)
      const encrypted = await encryptMessage(text, recipientPublicKey, privateKey)

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ciphertext: encrypted.ciphertext,
          nonce: encrypted.nonce,
        }),
      })

      const body = (await response.json().catch(() => null)) as {
        error?: string
        message?: DecryptedMessage
      } | null

      if (!response.ok) {
        throw new Error(body?.error ?? t('sendError'))
      }

      const row = body?.message
      if (!row) throw new Error(t('sendError'))

      cacheSentMessagePlaintext(row.id, text)
      onSent({
        ...row,
        message_type: row.message_type ?? 'text',
        plaintext: text,
        decryptState: 'ready',
      })
      setDraft('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('sendError'))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <form
        className="flex items-end gap-2 border-t border-border bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSend()
        }}
      >
        {isMentor ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 border-border"
            aria-label={tSchedule('dialogTitle')}
            onClick={() => setScheduleOpen(true)}
          >
            <CalendarPlus className="h-4 w-4 text-primary" aria-hidden />
          </Button>
        ) : null}
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          placeholder={t('inputPlaceholder')}
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-border px-3 py-2 font-arabic text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void handleSend()
            }
          }}
        />
        <Button
          type="submit"
          disabled={!draft.trim() || sending}
          className="bg-primary hover:bg-primary/90"
          aria-label={t('send')}
        >
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </form>

      {isMentor ? (
        <ScheduleMeetingDialog
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          conversationId={conversationId}
          onScheduled={onSent}
        />
      ) : null}
    </>
  )
}
