'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { decryptMessageRow } from '@/lib/encryption/decrypt-messages'
import type { ConversationMessageRow, DecryptedMessage } from '@/types/conversation'

type UseRealtimeMessagesOptions = {
  conversationId: string
  userId: string
  initialMessages: ConversationMessageRow[]
}

export function useRealtimeMessages({
  conversationId,
  userId,
  initialMessages,
}: UseRealtimeMessagesOptions) {
  const [messages, setMessages] = useState<DecryptedMessage[]>([])
  const seenIds = useRef(new Set<string>())

  const upsertDecrypted = useCallback(
    async (row: ConversationMessageRow) => {
      if (seenIds.current.has(row.id)) return
      seenIds.current.add(row.id)

      const isSchedule = row.message_type === 'schedule_proposal'
      const pending: DecryptedMessage = {
        ...row,
        plaintext: null,
        decryptState: isSchedule ? 'skip' : 'pending',
      }

      setMessages((current) => {
        if (current.some((item) => item.id === row.id)) return current
        return [...current, pending].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )
      })

      const decrypted = await decryptMessageRow(row, userId)
      setMessages((current) =>
        current.map((item) => (item.id === row.id ? decrypted : item)),
      )
    },
    [userId],
  )

  const updateMeetingOnMessage = useCallback((meetingId: string, meeting: NonNullable<DecryptedMessage['meeting']>) => {
    setMessages((current) =>
      current.map((item) =>
        item.meeting_id === meetingId ? { ...item, meeting } : item,
      ),
    )
  }, [])

  useEffect(() => {
    seenIds.current = new Set()
    setMessages([])
    void (async () => {
      for (const row of initialMessages) {
        await upsertDecrypted(row)
      }
    })()
  }, [conversationId, initialMessages, upsertDecrypted])

  useEffect(() => {
    if (!conversationId || !userId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as ConversationMessageRow
          void upsertDecrypted(row)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, userId, upsertDecrypted])

  const appendOptimistic = useCallback((message: DecryptedMessage) => {
    if (seenIds.current.has(message.id)) return
    seenIds.current.add(message.id)
    setMessages((current) =>
      [...current, message].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    )
  }, [])

  return { messages, appendOptimistic, updateMeetingOnMessage }
}
