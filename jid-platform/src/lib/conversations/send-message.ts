import 'server-only'

import { createClient } from '@/lib/supabase/server'
import {
  sendEncryptedMessageSchema,
  type SendEncryptedMessageInput,
} from '@/lib/validations/conversation-message'

export class ConversationMessageError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ConversationMessageError'
    this.status = status
  }
}

export async function insertEncryptedMessage(
  senderId: string,
  conversationId: string,
  input: SendEncryptedMessageInput,
) {
  const parsed = sendEncryptedMessageSchema.parse(input)
  const supabase = await createClient()

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id, mentor_id, mentee_id')
    .eq('id', conversationId)
    .maybeSingle()

  if (conversationError) throw new ConversationMessageError(conversationError.message, 500)
  if (!conversation) throw new ConversationMessageError('المحادثة غير موجودة', 404)

  const isParticipant =
    conversation.mentor_id === senderId || conversation.mentee_id === senderId
  if (!isParticipant) throw new ConversationMessageError('غير مصرح', 403)

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      ciphertext: parsed.ciphertext,
      nonce: parsed.nonce,
    })
    .select('id, conversation_id, sender_id, message_type, meeting_id, ciphertext, nonce, created_at')
    .single()

  if (error) throw new ConversationMessageError(error.message, 500)

  return data
}
