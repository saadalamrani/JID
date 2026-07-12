import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type MentorResponseStats = {
  avg_response_hours: number | null
  acceptance_rate_pct: number | null
  completed_sessions: number | null
}

const EMPTY_STATS: MentorResponseStats = {
  avg_response_hours: null,
  acceptance_rate_pct: null,
  completed_sessions: null,
}

function parseStatsPayload(raw: unknown): MentorResponseStats {
  if (!raw || typeof raw !== 'object') return EMPTY_STATS
  const row = raw as Record<string, unknown>
  return {
    avg_response_hours:
      row.avg_response_hours != null ? Number(row.avg_response_hours) : null,
    acceptance_rate_pct:
      row.acceptance_rate_pct != null ? Number(row.acceptance_rate_pct) : null,
    completed_sessions:
      row.completed_sessions != null ? Number(row.completed_sessions) : null,
  }
}

/** Live aggregate mentor response metrics via `get_mentor_response_stats` RPC. */
export async function fetchMentorResponseStats(
  mentorId: string,
): Promise<MentorResponseStats> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_mentor_response_stats', {
    p_mentor_id: mentorId,
  })

  if (error) return EMPTY_STATS
  return parseStatsPayload(data)
}
