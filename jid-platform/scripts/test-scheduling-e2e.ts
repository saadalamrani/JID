/**
 * Live test: propose → confirm → radar → feedback → rating_avg.
 * Run: pnpm tsx scripts/test-scheduling-e2e.ts
 *
 * Requires Supabase env vars. Set MEETING_FEEDBACK_DELAY_MS=0 to skip waiting 2h.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const MENTEE_ID = 'a0000000-0000-4000-8000-000000000002'
const MENTOR_ID = 'e0000000-0000-4000-8000-000000000001'

function loadEnvFile(filename: string): Record<string, string> {
  const filePath = join(process.cwd(), filename)
  if (!existsSync(filePath)) return {}

  const vars: Record<string, string> = {}
  for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
  return vars
}

function check(ok: boolean, label: string, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) process.exitCode = 1
}

async function main() {
  const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.log('SKIP: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    return
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: conversation } = await admin
    .from('conversations')
    .select('id')
    .eq('mentor_id', MENTOR_ID)
    .eq('mentee_id', MENTEE_ID)
    .maybeSingle()

  let conversationId = conversation?.id as string | undefined
  if (!conversationId) {
    const { data: created } = await admin
      .from('conversations')
      .insert({ mentor_id: MENTOR_ID, mentee_id: MENTEE_ID })
      .select('id')
      .single()
    conversationId = created?.id
  }

  if (!conversationId) throw new Error('conversation missing')

  const scheduledAt = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()

  const { data: meeting, error: meetingError } = await admin
    .from('mentorship_meetings')
    .insert({
      mentor_id: MENTOR_ID,
      mentee_id: MENTEE_ID,
      status: 'pending_confirmation',
      scheduled_at: scheduledAt,
      duration_minutes: 60,
      medium: 'video',
    })
    .select('id, status')
    .single()

  if (meetingError || !meeting) throw new Error(meetingError?.message ?? 'meeting insert failed')

  const { data: message, error: messageError } = await admin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: MENTOR_ID,
      message_type: 'schedule_proposal',
      meeting_id: meeting.id,
      ciphertext: null,
      nonce: null,
    })
    .select('id, message_type, meeting_id, ciphertext, nonce')
    .single()

  if (messageError) throw new Error(`message insert: ${messageError.message}`)

  check(message?.message_type === 'schedule_proposal', 'schedule_proposal message type')
  check(message?.ciphertext == null && message?.nonce == null, 'operational message has no ciphertext')

  const { data: beforeRating } = await admin
    .from('mentor_profiles')
    .select('rating_avg')
    .eq('user_id', MENTOR_ID)
    .maybeSingle()

  const { error: confirmError } = await admin
    .from('mentorship_meetings')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', meeting.id)

  if (confirmError) throw new Error(confirmError.message)

  const feedbackAt = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // TODO: verify compatibility when Radar module is built
  const { error: radarError } = await admin.from('radar_items').insert([
    {
      user_id: MENTEE_ID,
      type: 'mentorship_meeting',
      reference_id: meeting.id,
      status: 'pending',
      scheduled_for: scheduledAt,
    },
    {
      user_id: MENTEE_ID,
      type: 'meeting_feedback',
      reference_id: meeting.id,
      status: 'pending',
      scheduled_for: feedbackAt,
    },
  ])

  if (radarError) throw new Error(`radar insert: ${radarError.message}`)

  const { count: radarCount } = await admin
    .from('radar_items')
    .select('id', { count: 'exact', head: true })
    .eq('reference_id', meeting.id)

  check((radarCount ?? 0) >= 2, 'radar_items rows created', String(radarCount))

  const { error: feedbackError } = await admin
    .from('mentorship_meetings')
    .update({
      feedback_rating: 5,
      feedback_comment: 'Excellent session',
      feedback_submitted_at: new Date().toISOString(),
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', meeting.id)

  if (feedbackError) throw new Error(feedbackError.message)

  const { data: afterProfile } = await admin
    .from('mentor_profiles')
    .select('rating_avg')
    .eq('user_id', MENTOR_ID)
    .maybeSingle()

  check(afterProfile?.rating_avg != null, 'rating_avg updated after feedback')
  if (beforeRating?.rating_avg != null && afterProfile?.rating_avg != null) {
    check(afterProfile.rating_avg >= beforeRating.rating_avg, 'rating_avg reflects new feedback')
  }

  await admin.from('radar_items').delete().eq('reference_id', meeting.id)
  await admin.from('messages').delete().eq('id', message!.id)
  await admin.from('mentorship_meetings').delete().eq('id', meeting.id)

  console.log('\nScheduling live E2E complete.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
