/**
 * Section 7.4–7.7 — claim review workspace + mentor application detail verification.
 * Run: pnpm tsx scripts/verify-staff-claim-review.ts
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3002'
const ROOT = join(process.cwd())

const STAFF_HEADERS = {
  'x-jid-test-role': 'staff',
  'x-jid-test-aal2': 'true',
}

let passed = 0
let failed = 0

function pass(label: string, detail?: string) {
  passed += 1
  console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`)
}

function fail(label: string, detail?: string) {
  failed += 1
  console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
}

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

async function main() {
  console.log(`Section 7.4–7.7 — claim review workspace (${BASE})\n`)

  try {
    await fetch(BASE, { method: 'HEAD' })
  } catch {
    console.error(`Dev server not reachable at ${BASE}. Start with: pnpm dev`)
    process.exit(1)
  }

  const claimPage = readSrc('src/app/[locale]/(staff)/staff/claims/[id]/page.tsx')
  const workspace = readSrc(
    'src/app/[locale]/(staff)/staff/claims/[id]/_components/claim-review-workspace.tsx',
  )
  const checklist = readSrc(
    'src/app/[locale]/(staff)/staff/claims/[id]/_components/checklist-panel.tsx',
  )
  const shared = readSrc('src/lib/staff/claim-review-shared.ts')
  const actions = readSrc('src/app/[locale]/(staff)/staff/claims/actions.ts')
  const mentorPage = readSrc('src/app/[locale]/(staff)/staff/mentor-applications/[id]/page.tsx')

  if (claimPage.includes('fetchClaimReviewWorkspace')) {
    pass('Claim detail page server-fetches workspace')
  } else {
    fail('Claim detail page server-fetches workspace')
  }

  if (workspace.includes('isSelfReview') && workspace.includes('checklistComplete')) {
    pass('Workspace blocks self-review and gates approve on checklist')
  } else {
    fail('Workspace self-review / checklist gating')
  }

  const checklistKeys = [
    'domain_match',
    'entity_exists',
    'linkedin_verified',
    'job_reasonable',
    'no_duplicates',
  ]
  if (checklistKeys.every((key) => workspace.includes(key))) {
    pass('Checklist has 5 Section 7.6 items')
  } else {
    fail('Checklist items', 'missing one or more keys in workspace')
  }

  if (checklist.includes('progressbar') || checklist.includes('progress')) {
    pass('ChecklistPanel has progress bar')
  } else {
    fail('ChecklistPanel progress bar')
  }

  if (shared.includes('MENTOR_CHECKLIST_KEYS')) {
    pass('Mentor checklist keys defined in shared module')
  } else {
    fail('Mentor checklist keys')
  }

  if (actions.includes("rpc('review_claim'") && actions.includes("revalidatePath('/staff/claims')")) {
    pass('reviewClaim action calls review_claim RPC + revalidates')
  } else {
    fail('reviewClaim server action')
  }

  if (actions.includes('notifyClaimDecision')) {
    pass('reviewClaim triggers notification helper (or TODO path)')
  } else {
    fail('reviewClaim notification hook')
  }

  if (mentorPage.includes('MentorApplicationWorkspace')) {
    pass('Mentor [id] detail page uses full workspace')
  } else {
    fail('Mentor detail page')
  }

  const mentorWorkspace = readSrc(
    'src/app/[locale]/(staff)/staff/mentor-applications/[id]/_components/mentor-application-workspace.tsx',
  )
  if (
    mentorWorkspace.includes('MENTOR_CHECKLIST_KEYS') &&
    mentorWorkspace.includes('reviewMentorApplicationAction')
  ) {
    pass('Mentor workspace has checklist + server action review')
  } else {
    fail('Mentor workspace checklist / action')
  }

  const fakeClaimId = '00000000-0000-4000-8000-000000000001'
  const claimDetailRes = await fetch(`${BASE}/staff/claims/${fakeClaimId}`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  if (claimDetailRes.status === 200) {
    pass('/staff/claims/[id] route renders', 'HTTP 200 (not found UI ok)')
  } else {
    fail('/staff/claims/[id] route', `HTTP ${claimDetailRes.status}`)
  }

  const fakeMentorId = '00000000-0000-4000-8000-000000000002'
  const mentorDetailRes = await fetch(`${BASE}/staff/mentor-applications/${fakeMentorId}`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  if (mentorDetailRes.status === 200) {
    pass('/staff/mentor-applications/[id] route renders', 'HTTP 200')
  } else {
    fail('/staff/mentor-applications/[id] route', `HTTP ${mentorDetailRes.status}`)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
