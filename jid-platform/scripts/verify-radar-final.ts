/**
 * Sections 14 / 15 — Opportunity Radar final verification.
 * Run: pnpm tsx scripts/verify-radar-final.ts
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { RADAR_ANALYTICS_EVENTS, ANALYTICS_EVENTS } from '../src/lib/analytics/track'
import { hasUnseenCompanyStatusChange } from '../src/lib/hooks/use-glow-state'
import { isAllowedApplicantStatusTransition } from '../src/lib/radar/applicant-status-transitions'
import { getAllowedTargets } from '../src/lib/radar/drag-rules'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue
      walk(full, files)
    } else if (/\.(ts|tsx|js|jsx|sql)$/.test(entry)) {
      files.push(full)
    }
  }
  return files
}

function grepAll(pattern: RegExp): string[] {
  return walk(SRC).filter((file) => pattern.test(readFileSync(file, 'utf-8')))
}

let passed = 0
let failed = 0
const manual: string[] = []

function check(label: string, ok: boolean) {
  if (ok) {
    passed += 1
    console.log(`  PASS  ${label}`)
  } else {
    failed += 1
    console.log(`  FAIL  ${label}`)
  }
}

function manualCheck(label: string, note: string) {
  manual.push(`${label}: ${note}`)
  console.log(`  MANUAL  ${label} — ${note}`)
}

console.log('Opportunity Radar — Final Verification (Sections 14 / 15)\n')

// ── Section 15 analytics ─────────────────────────────────────────────────────

const radarSource =
  read('src/components/radar/kanban-board.tsx') +
  read('src/components/radar/kanban-column.tsx') +
  read('src/components/radar/mobile-application-card.tsx') +
  read('src/components/radar/radar-viewed-tracker.tsx') +
  read('src/components/radar/radar-mobile-timeline-nav.tsx') +
  read('src/components/radar/meeting-card.tsx') +
  read('src/components/radar/feedback-prompt-card.tsx') +
  read('src/lib/hooks/use-realtime-applications.ts') +
  read('src/lib/hooks/use-mark-application-seen.ts') +
  read('src/components/shared/profile-switcher.tsx')

for (const event of RADAR_ANALYTICS_EVENTS) {
  check(
    `analytics: ${event} declared and referenced`,
    ANALYTICS_EVENTS.includes(event) && radarSource.includes(`'${event}'`),
  )
}

// ── Checklist items ─────────────────────────────────────────────────────────

const srcText = walk(SRC)
  .map((f) => readFileSync(f, 'utf-8'))
  .join('\n')

check(
  'no profiles.is_mentor / profiles.mentor_status references',
  !/profiles\.is_mentor|profiles\.mentor_status/.test(srcText),
)

check(
  'use-mentor-mode uses mentor_profiles.status approved',
  read('src/lib/hooks/use-mentor-mode.ts').includes("data?.status === 'approved'"),
)

const switcherDefs = grepAll(/export function ProfileSwitcher/)
check(
  'single ProfileSwitcher component (one export)',
  switcherDefs.length === 1,
)

const radarItemWrites = grepAll(/from\(['"]radar_items['"]\)/).filter(
  (f) => !f.includes('queries.ts'),
)
check(
  'no app writes to radar_items (reads only in legacy queries.ts)',
  radarItemWrites.length === 0,
)

check(
  'confirmMeeting does not write radar_items',
  !read('src/lib/meetings/confirm-meeting.ts').includes("from('radar_items')"),
)

check(
  'no client hoursAfter / isMeetingFeedbackDue morph',
  !grepAll(/isMeetingFeedbackDue|hoursAfter|feedback-timing|MeetingRadarCard/).length,
)

check(
  'feedback uses should_show_feedback only',
  read('src/components/radar/feedback-prompt-card.tsx').includes('should_show_feedback') ||
    read('src/components/radar/mentorship-timeline.tsx').includes('should_show_feedback'),
)

check(
  'client blocks pending drag with AUTO_MOVE_TOAST',
  read('src/components/radar/kanban-column.tsx').includes('AUTO_MOVE_TOAST_AR'),
)

check(
  'server applicant status guard migration exists',
  read('supabase/migrations/065_applicant_application_status_guard.sql').includes(
    'enforce_applicant_application_status_status_guard',
  ) ||
    read('supabase/migrations/065_applicant_application_status_guard.sql').includes(
      'enforce_applicant_application_status_guard',
    ),
)

check(
  'server rejects pending → shortlisted transition',
  !isAllowedApplicantStatusTransition('pending', 'shortlisted'),
)

check(
  'server rejects saved → invited transition',
  !isAllowedApplicantStatusTransition('saved', 'invited'),
)

check(
  'radar PATCH API route exists',
  read('src/app/api/radar/applications/[id]/route.ts').includes('updateApplicantApplicationStatus'),
)

const uiStore = read('src/stores/ui-store.ts')
check(
  'Zustand ui-store is UI-only fields',
  uiStore.includes('currentMode:') &&
    uiStore.includes('sidebarOpen:') &&
    uiStore.includes('isDragging:') &&
    !/applications:\s|meetings:\s/.test(uiStore),
)

check(
  'glow clears when last_seen >= status_changed',
  !hasUnseenCompanyStatusChange(
    {
      status_changed_at: '2026-07-06T10:00:00.000Z',
      last_seen_by_user_at: '2026-07-06T12:00:00.000Z',
      status_changed_by: 'company-id',
      applicant_id: 'user-id',
    },
    'user-id',
  ),
)

check(
  'IntersectionObserver mark-as-seen hook exists',
  read('src/lib/hooks/use-mark-application-seen.ts').includes('IntersectionObserver'),
)

check(
  'realtime applications subscription exists',
  read('src/lib/hooks/use-realtime-applications.ts').includes('postgres_changes'),
)

check(
  'mobile + desktop share TanStack query in radar-page-shell',
  read('src/app/[locale]/(individual)/radar/_components/radar-page-shell.tsx').includes(
    'applicationsQuery.data',
  ) &&
    read('src/app/[locale]/(individual)/radar/_components/radar-page-shell.tsx').includes(
      'MobileKanban',
    ) &&
    read('src/app/[locale]/(individual)/radar/_components/radar-page-shell.tsx').includes(
      'KanbanBoard',
    ),
)

check(
  'save job uses status saved',
  read('src/lib/jobs/self-declaration-server.ts').includes("status: 'saved'"),
)

check(
  'declare upserts saved → pending',
  read('src/lib/jobs/self-declaration-server.ts').includes("status: 'pending'") &&
    read('src/lib/jobs/self-declaration-server.ts').includes('onConflict'),
)

check(
  'allowed mobile targets match canTransition',
  getAllowedTargets('saved', 'saved').join() === 'archived',
)

manualCheck(
  'realtime company update <2s',
  'Open /radar, PATCH application status as company; card+glow+toast within 2s',
)

manualCheck(
  'full user walkthrough',
  'save 2 jobs → declare 1 → company status → glow → archive interview → timeline → feedback → rating_avg',
)

manualCheck(
  'invalid API transition blocked',
  'PATCH /api/radar/applications/:id with status=invited on pending row → 403',
)

console.log(`\nAutomated: ${passed} passed, ${failed} failed`)
if (manual.length) {
  console.log('\nManual verification:')
  for (const line of manual) console.log(`  • ${line}`)
}

if (failed > 0) {
  console.log('\n❌ Opportunity Radar module NOT complete — fix failures above.')
  process.exit(1)
}

console.log('\n✅ Opportunity Radar module COMPLETE (automated checks). Complete manual walkthrough to confirm.')
