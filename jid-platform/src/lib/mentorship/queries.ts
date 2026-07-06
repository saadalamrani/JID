import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { MenteeSnapshot, MentorshipRequestRecord } from '@/types/mentorship-request'

function parseMenteeSnapshot(raw: unknown): MenteeSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  return raw as MenteeSnapshot
}

export async function fetchMentorPendingRequests(
  mentorId: string,
): Promise<MentorshipRequestRecord[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mentorship_requests')
    .select(
      'id, mentee_id, mentor_id, status, focus_area, intent_statement, preferred_medium, mentee_snapshot, created_at, expires_at',
    )
    .eq('mentor_id', mentorId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    mentee_id: row.mentee_id,
    mentor_id: row.mentor_id,
    status: row.status,
    focus_area: row.focus_area,
    intent_statement: row.intent_statement,
    preferred_medium: row.preferred_medium ?? null,
    mentee_snapshot: parseMenteeSnapshot(row.mentee_snapshot),
    created_at: row.created_at,
    expires_at: row.expires_at,
  }))
}
