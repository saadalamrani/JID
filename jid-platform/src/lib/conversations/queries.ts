import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type {
  ConversationDetail,
  ConversationListItem,
  ConversationParticipant,
  ConversationMessageRow,
} from '@/types/conversation'
import type { MeetingSummary } from '@/types/meeting'

type ProfileRef = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

type ConversationRow = {
  id: string
  mentor_id: string
  mentee_id: string
  mentorship_request_id: string | null
  last_message_at: string | null
  created_at: string
  mentor: ProfileRef | ProfileRef[] | null
  mentee: ProfileRef | ProfileRef[] | null
}

function unwrapProfile(ref: ProfileRef | ProfileRef[] | null): ConversationParticipant | null {
  if (!ref) return null
  const row = Array.isArray(ref) ? ref[0] : ref
  if (!row?.id) return null
  return {
    id: row.id,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
  }
}

function mapConversation(
  row: ConversationRow,
  viewerId: string,
): ConversationListItem | null {
  const mentor = unwrapProfile(row.mentor)
  const mentee = unwrapProfile(row.mentee)
  const other =
    row.mentor_id === viewerId ? mentee : row.mentee_id === viewerId ? mentor : null

  if (!other) return null

  return {
    id: row.id,
    mentor_id: row.mentor_id,
    mentee_id: row.mentee_id,
    mentorship_request_id: row.mentorship_request_id,
    last_message_at: row.last_message_at,
    other_user: other,
  }
}

const CONVERSATION_SELECT = `
  id,
  mentor_id,
  mentee_id,
  mentorship_request_id,
  last_message_at,
  created_at,
  mentor:profiles!conversations_mentor_id_fkey(id, full_name, avatar_url),
  mentee:profiles!conversations_mentee_id_fkey(id, full_name, avatar_url)
` as const

export async function fetchUserConversations(userId: string): Promise<ConversationListItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return ((data ?? []) as ConversationRow[])
    .map((row) => mapConversation(row, userId))
    .filter((row): row is ConversationListItem => row !== null)
}

export async function fetchConversationById(
  conversationId: string,
  userId: string,
): Promise<ConversationDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .eq('id', conversationId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const row = data as ConversationRow
  const isParticipant = row.mentor_id === userId || row.mentee_id === userId
  if (!isParticipant) return null

  const mapped = mapConversation(row, userId)
  if (!mapped) return null

  return {
    ...mapped,
    created_at: row.created_at,
  }
}

export async function fetchConversationMessages(
  conversationId: string,
): Promise<ConversationMessageRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('messages')
    .select(
      `
      id,
      conversation_id,
      sender_id,
      message_type,
      meeting_id,
      ciphertext,
      nonce,
      created_at,
      meeting:mentorship_meetings(
        id,
        mentor_id,
        mentee_id,
        status,
        scheduled_at,
        duration_minutes,
        meeting_url,
        notes,
        medium,
        feedback_rating,
        feedback_submitted_at
      )
    `,
    )
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    const { data: fallback, error: fallbackError } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, message_type, meeting_id, ciphertext, nonce, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (fallbackError) throw new Error(fallbackError.message)

    const rows = (fallback ?? []) as ConversationMessageRow[]
    const meetingIds = rows
      .map((row) => row.meeting_id)
      .filter((id): id is string => Boolean(id))

    if (meetingIds.length === 0) return rows

    const { data: meetings } = await supabase
      .from('mentorship_meetings')
      .select(
        'id, mentor_id, mentee_id, status, scheduled_at, duration_minutes, meeting_url, notes, medium, feedback_rating, feedback_submitted_at',
      )
      .in('id', meetingIds)

    const byId = new Map(
      (meetings ?? []).map((m) => [m.id, m as unknown as MeetingSummary]),
    )
    return rows.map((row) => ({
      ...row,
      meeting: row.meeting_id ? (byId.get(row.meeting_id) ?? null) : null,
    }))
  }

  return ((data ?? []) as Array<ConversationMessageRow & { meeting: MeetingSummary | MeetingSummary[] | null }>).map(
    (row) => ({
      ...row,
      meeting: Array.isArray(row.meeting) ? (row.meeting[0] ?? null) : (row.meeting ?? null),
    }),
  )
}
