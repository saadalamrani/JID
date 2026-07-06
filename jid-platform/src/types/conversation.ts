import type { MeetingSummary } from '@/types/meeting'

export type ConversationParticipant = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export type ConversationListItem = {
  id: string
  mentor_id: string
  mentee_id: string
  mentorship_request_id: string | null
  last_message_at: string | null
  other_user: ConversationParticipant
}

export type ConversationDetail = ConversationListItem & {
  created_at: string
}

export type MessageType = 'text' | 'schedule_proposal'

export type ConversationMessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  message_type: MessageType
  meeting_id: string | null
  ciphertext: string | null
  nonce: string | null
  created_at: string
  meeting?: MeetingSummary | null
}

/** @deprecated Use ConversationMessageRow */
export type EncryptedMessageRow = ConversationMessageRow

export type DecryptedMessage = ConversationMessageRow & {
  plaintext: string | null
  decryptState: 'pending' | 'ready' | 'error' | 'skip'
  isSystem?: boolean
}
