/**
 * Sections 4.12–4.14 — Smart Scheduling + Radar sync verification.
 * Run: pnpm tsx scripts/verify-scheduling.ts
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(process.cwd())

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

function check(ok: boolean, label: string) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`)
  if (!ok) process.exitCode = 1
}

const migration = read('supabase/migrations/062_smart_scheduling.sql')
const scheduleDialog = read(
  'src/app/[locale]/(authenticated)/conversations/_components/schedule-meeting-dialog.tsx',
)
const scheduleBubble = read(
  'src/app/[locale]/(authenticated)/conversations/_components/schedule-bubble-message.tsx',
)
const radarCard = read('src/components/radar/meeting-radar-card.tsx')
const chatInput = read(
  'src/app/[locale]/(authenticated)/conversations/_components/chat-input-bar.tsx',
)
const proposeLib = read('src/lib/meetings/propose-schedule.ts')
const confirmLib = read('src/lib/meetings/confirm-meeting.ts')
const feedbackLib = read('src/lib/meetings/submit-feedback.ts')

check(migration.includes("message_type IN ('text', 'schedule_proposal')"), 'messages.message_type column')
check(migration.includes('ciphertext IS NULL'), 'schedule_proposal allows null ciphertext')
check(migration.includes('pending_confirmation'), 'meetings pending_confirmation status')
check(migration.includes('feedback_rating'), 'meetings feedback columns')
check(migration.includes('update_mentor_stats_on_meeting'), 'rating trigger function')
check(migration.includes('sync_meeting_radar_on_confirm'), 'radar sync RPC on confirm')

check(scheduleDialog.includes('ScheduleMeetingDialog'), 'schedule meeting dialog component')
check(chatInput.includes('ScheduleMeetingDialog'), 'chat input opens schedule dialog for mentor')
check(chatInput.includes('isMentor'), 'chat input receives mentor flag')

check(scheduleBubble.includes('ScheduleBubbleMessage'), 'schedule bubble component')
check(scheduleBubble.includes('pending_confirmation'), 'bubble shows pending status')
check(scheduleBubble.includes('/api/meetings/'), 'bubble confirms via meetings API')

check(read('src/app/api/conversations/[id]/schedule/route.ts').includes('proposeMeetingSchedule'), 'POST schedule API')
check(proposeLib.includes("status: 'pending_confirmation'"), 'proposal creates pending meeting')
check(proposeLib.includes("message_type: 'schedule_proposal'"), 'proposal creates schedule message')

check(read('src/app/api/meetings/[id]/confirm/route.ts').includes('confirmMeeting'), 'PATCH confirm API')
check(confirmLib.includes('sync_meeting_radar_on_confirm'), 'confirmMeeting syncs radar')
check(confirmLib.includes("status: 'confirmed'"), 'confirmMeeting sets confirmed')

check(read('src/app/api/meetings/[id]/feedback/route.ts').includes('submitMeetingFeedback'), 'POST feedback API')
check(feedbackLib.includes('feedback_rating'), 'feedback stores rating')
check(feedbackLib.includes("status: 'completed'"), 'feedback completes meeting')

check(radarCard.includes('isMeetingFeedbackDue'), 'radar card time-based feedback morph')
check(radarCard.includes('isMeetingUpcoming'), 'radar card shows upcoming state')
check(migration.includes('TODO: verify compatibility when Radar module is built') || confirmLib.includes('TODO: verify compatibility when Radar module is built'), 'radar bridge TODO comment')

console.log('\nScheduling verification complete.')
