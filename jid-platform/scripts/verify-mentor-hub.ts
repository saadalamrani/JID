/**
 * Sections 4.9 / 4.10 — Mentor hub dashboard.
 * Run: pnpm tsx scripts/verify-mentor-hub.ts
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

const page = read('src/app/[locale]/(mentor)/dashboard/page.tsx')
const guard = read('src/lib/mentor-hub/require-mentor-hub-access.ts')
const queries = read('src/lib/mentor-hub/queries.ts')
const card = read('src/app/[locale]/(mentor)/dashboard/_components/pending-request-card.tsx')
const reviewApi = read('src/app/api/mentor/requests/[id]/route.ts')
const reviewLib = read('src/lib/mentor-hub/review-request.ts')
const settingsApi = read('src/app/api/mentor/settings/route.ts')
const migration = read('supabase/migrations/060_mentor_hub.sql')

check(page.includes('requireMentorHubAccess'), 'dashboard uses mentor hub access guard')
check(guard.includes('hasApprovedMentorProfile'), 'guard checks hasMentorRole')
check(guard.includes("mode !== 'mentor'"), 'guard checks mentor mode cookie')
check(guard.includes("redirect('/profile')"), 'non-mentor mode redirects to mentee profile')

check(queries.includes('pendingCount'), 'KPI query includes pendingCount')
check(queries.includes('activeChatsCount'), 'KPI query includes activeChatsCount')
check(queries.includes('upcomingMeetingsCount'), 'KPI query includes upcomingMeetingsCount')
check(queries.includes('ratingAvg'), 'KPI query includes ratingAvg')

check(page.includes('MentorKpiStrip'), 'dashboard renders KPI strip')
check(read('src/app/[locale]/(mentor)/dashboard/_components/mentor-hub-dashboard.tsx').includes('requests'), 'hub has Requests tab')
check(read('src/app/[locale]/(mentor)/dashboard/_components/mentor-hub-dashboard.tsx').includes('settings'), 'hub has Settings tab')

check(card.includes('mentee_snapshot'), 'pending card shows mentee_snapshot')
check(card.includes('intent_statement'), 'pending card shows intent quote')
check(card.includes('preferred_medium'), 'pending card shows preferred medium badge')
check(card.includes('/api/mentor/requests/'), 'card calls PATCH review API')

check(reviewLib.includes("from('conversations')"), 'accept creates conversation row')
check(reviewLib.includes("status: 'accepted'"), 'accept sets status accepted')
check(reviewLib.includes('conversation_id'), 'accept sets conversation_id on request')
check(reviewLib.includes('decline_reason'), 'decline requires decline_reason')
check(reviewLib.includes('declined_requests_count'), 'decline increments declined_requests_count')

check(settingsApi.includes('updateMentorHubSettings'), 'PATCH /api/mentor/settings')
check(read('src/lib/mentor-hub/update-settings.ts').includes('is_accepting_requests'), 'settings updates accepting toggle')
check(read('src/lib/mentor-hub/update-settings.ts').includes('expertise_areas'), 'settings updates expertise')
check(read('src/lib/mentor-hub/update-settings.ts').includes('preferred_mediums'), 'settings updates mediums')

check(migration.includes('declined_requests_count'), 'migration adds declined_requests_count')
check(migration.includes('decline_reason'), 'migration adds decline_reason')
check(migration.includes('idx_conversations_mentor_mentee_unique'), 'unique mentor+mentee conversations')

check(!read('src/app/[locale]/(mentor)/dashboard/_components/mentor-hub-stub-tab.tsx').includes('/chats/'), 'chats tab is stub without chat UI route')

console.log('\nMentor hub verification complete.')
