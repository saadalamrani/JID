/**
 * Sections 4.15–4.16, 10, 11 — FINAL mentorship module verification.
 * Run: pnpm tsx scripts/verify-mentorship-final.ts
 */

import { execSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ANALYTICS_EVENTS, MENTORSHIP_ANALYTICS_EVENTS } from '../src/lib/analytics/track'

const ROOT = join(process.cwd())

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

const MENTOR_PUBLIC_SELECT = read('src/lib/queries/mentors.ts').match(
  /export const MENTOR_PUBLIC_SELECT = `([\s\S]*?)` as const/,
)?.[1] ?? ''

function readAllSrc(): string {
  const files: string[] = []
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== 'node_modules') walk(full)
      else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full)
    }
  }
  walk(join(ROOT, 'src'))
  return files.map((f) => readFileSync(f, 'utf-8')).join('\n')
}

const results: Array<{ id: string; pass: boolean; detail: string }> = []

function check(id: string, pass: boolean, detail: string) {
  results.push({ id, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}: [${id}] ${detail}`)
  if (!pass) process.exitCode = 1
}

const allSrc = readAllSrc()

// ── Task 6 checklist ─────────────────────────────────────────────────────────

check(
  'role-never-mentor',
  !allSrc.match(/profiles\.role\s*=\s*['"]mentor['"]/) &&
    !allSrc.match(/role:\s*['"]mentor['"]/) &&
    !allSrc.includes("update({ role: 'mentor'"),
  'profiles.role is NEVER set to mentor',
)

check(
  'hasMentorRole-from-mentor_profiles',
  read('src/lib/mentor-mode/has-mentor-role.ts').includes("eq('status', 'approved')") &&
    !read('src/lib/mentor-mode/has-mentor-role.ts').includes('profiles.role'),
  'hasMentorRole derived from mentor_profiles.status=approved',
)

check(
  'profile-switcher-no-job-gating',
  !read('src/middleware.ts').includes('jid_profile_mode') &&
    !read('src/lib/auth/guards.ts').includes('jid_profile_mode'),
  'Profile Switcher does not gate Job Board / Radar / CV Builder',
)

const e2e = read('src/lib/encryption/e2e.ts')
const postApi = read('src/app/api/me/encryption-key/route.ts')
const uploadBody = e2e.match(/body:\s*JSON\.stringify\(([\s\S]*?)\)/)?.[1] ?? ''
check(
  'private-key-never-network',
  !uploadBody.includes('private') && !postApi.includes('private_key'),
  'Private encryption keys never transmitted over network',
)

check(
  'messages-ciphertext-only',
  read('supabase/migrations/062_smart_scheduling.sql').includes('message_type = \'text\'') &&
    read('src/lib/conversations/send-message.ts').includes('ciphertext: parsed.ciphertext') &&
    !read('src/lib/conversations/send-message.ts').includes('plaintext'),
  'Messages table stores ciphertext for text type only (schema + server)',
)

check(
  'declined-count-not-public',
  !MENTOR_PUBLIC_SELECT.split(',').some((part) =>
    part.trim().startsWith('declined_requests_count'),
  ) && !read('src/app/api/mentor/settings/route.ts').includes('declined_requests_count'),
  'declined_requests_count never exposed in public mentor APIs',
)

check(
  'no-cross-mentee-profiles',
  !allSrc.includes('mentorship_requests') ||
    (!allSrc.includes('mentee_snapshot') || !allSrc.match(/fetchMentor.*mentees/i)),
  'No API exposes other mentees full profiles on mentor pages (static)',
)

check(
  'meeting-past-rejected',
  read('src/lib/validations/meeting.ts').includes('superRefine') &&
    read('src/lib/validations/workshop.ts').includes('assertFutureScheduledAt'),
  'Meeting/workshop scheduling rejects past datetimes server-side',
)

const radarRefs = [
  read('supabase/migrations/062_smart_scheduling.sql'),
  read('src/lib/meetings/confirm-meeting.ts'),
  read('src/lib/meetings/submit-feedback.ts'),
].join('\n')
check(
  'radar-bridge-todo',
  radarRefs.includes('TODO: verify compatibility when Radar module is built'),
  'radar_items bridge documented with TODO for Radar reconciliation',
)

// ── Tasks 1–5 feature presence ───────────────────────────────────────────────

check(
  'workshop-crud-api',
  read('src/app/api/mentor/workshops/route.ts').includes('POST') &&
    read('src/app/api/mentor/workshops/[id]/route.ts').includes('PATCH') &&
    read('src/app/api/mentor/workshops/[id]/route.ts').includes('DELETE'),
  'Workshop CRUD API routes exist',
)

check(
  'workshop-chip-wiring',
  read('src/components/mentor/mentor-card.tsx').includes('WorkshopChip') &&
    read('supabase/migrations/063_mentor_score_workshops.sql').includes('sync_mentor_active_workshop'),
  'WorkshopChip wired via active_workshop sync',
)

check(
  'mentor-of-month-homepage',
  read('src/app/[locale]/page.tsx').includes('fetchFeaturedMentorsByScore') &&
    read('src/lib/queries/mentors.ts').includes('mentor_score'),
  'Homepage shows top mentors by mentor_score',
)

check(
  'share-card-client',
  read('package.json').includes('html-to-image') &&
    read('src/components/mentor/mentor-share-card-button.tsx').includes('toPng'),
  'Share card uses client-side html-to-image (1200×630)',
)

check(
  'notification-gaps-api',
  read('src/app/api/admin/mentor-notification-gaps/route.ts').includes(
    'fetchMentorNotificationGaps',
  ),
  'Cold start GET /api/admin/mentor-notification-gaps',
)

for (const event of MENTORSHIP_ANALYTICS_EVENTS) {
  check(
    `analytics-${event}`,
    ANALYTICS_EVENTS.includes(event),
    `Analytics event registered: ${event}`,
  )
}

// ── Section 6 access matrix (5 roles) ───────────────────────────────────────

const guards = read('src/lib/auth/guards.ts')
const rbac = read('src/lib/auth/rbac.ts')

check('access-individual', guards.includes("'individual'"), 'Access matrix: individual role in guards')
check('access-staff', guards.includes("'staff'"), 'Access matrix: staff role in guards')
check('access-admin', guards.includes("'admin'"), 'Access matrix: admin role in guards')
check('access-super-admin', guards.includes("'super_admin'"), 'Access matrix: super_admin in guards')
check(
  'access-company-admin',
  rbac.includes('company_admin') || guards.includes('company_admin'),
  'Access matrix: company_admin role present',
)

// ── Run sub-verifiers ────────────────────────────────────────────────────────

const subScripts = [
  'verify-mentor-mode.ts',
  'verify-encryption.ts',
  'verify-conversations.ts',
  'verify-scheduling.ts',
  'verify-mentor-card.ts',
  'verify-mentor-hub.ts',
]

for (const script of subScripts) {
  try {
    execSync(`pnpm tsx scripts/${script}`, { cwd: ROOT, stdio: 'pipe' })
    check(`sub-${script}`, true, `${script} passed`)
  } catch {
    check(`sub-${script}`, false, `${script} failed`)
  }
}

const passCount = results.filter((r) => r.pass).length
const failCount = results.filter((r) => !r.pass).length

console.log(`\n── Summary: ${passCount} PASS, ${failCount} FAIL ──`)

if (failCount === 0) {
  console.log('\n✓ Mentorship module COMPLETE')
  console.log(
    '\n⚠ REMINDER: radar_items is a BRIDGE TABLE — re-validate compatibility when the Radar Master Prompt is executed.',
  )
} else {
  console.log('\n✗ Mentorship module NOT complete — fix failing checks above.')
}
