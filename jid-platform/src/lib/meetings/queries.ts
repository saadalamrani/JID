import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { RadarMeetingItem, MeetingSummary } from '@/types/meeting'

const MEETING_SELECT =
  'id, mentor_id, mentee_id, status, scheduled_at, duration_minutes, meeting_url, notes, medium, feedback_rating, feedback_submitted_at' as const

function asMeetingSummary(row: Record<string, unknown>): MeetingSummary {
  return row as MeetingSummary
}

export async function fetchUserRadarMeetings(userId: string): Promise<RadarMeetingItem[]> {
  const supabase = await createClient()

  const { data: fallback, error: fallbackError } = await supabase
    .from('radar_items')
    .select('id, user_id, type, reference_id, column_name, status, scheduled_for, created_at')
    .eq('user_id', userId)
    .in('type', ['mentorship_meeting', 'meeting_feedback'])
    .order('scheduled_for', { ascending: true, nullsFirst: false })

  if (fallbackError) throw new Error(fallbackError.message)

  const rows = fallback ?? []
  const meetingIds = rows
    .map((row) => row.reference_id)
    .filter((id): id is string => Boolean(id))

  let meetingsById = new Map<string, MeetingSummary>()
  if (meetingIds.length > 0) {
    const { data: meetings } = await supabase
      .from('mentorship_meetings')
      .select(MEETING_SELECT)
      .in('id', meetingIds)
    meetingsById = new Map(
      (meetings ?? []).map((m) => [m.id, asMeetingSummary(m)]),
    )
  }

  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    reference_id: row.reference_id,
    column_name: row.column_name,
    status: row.status,
    scheduled_for: row.scheduled_for,
    created_at: row.created_at,
    meeting: row.reference_id ? (meetingsById.get(row.reference_id) ?? null) : null,
  }))
}

export async function fetchMeetingForParticipant(
  meetingId: string,
  userId: string,
): Promise<MeetingSummary | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mentorship_meetings')
    .select(MEETING_SELECT)
    .eq('id', meetingId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const meeting = asMeetingSummary(data)
  if (meeting.mentor_id !== userId && meeting.mentee_id !== userId) return null
  return meeting
}
