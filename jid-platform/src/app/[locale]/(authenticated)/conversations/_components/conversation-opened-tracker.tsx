'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics/track'

type ConversationOpenedTrackerProps = {
  conversationId: string
}

export function ConversationOpenedTracker({ conversationId }: ConversationOpenedTrackerProps) {
  useEffect(() => {
    track('conversation_opened', { conversation_id: conversationId })
  }, [conversationId])

  return null
}
