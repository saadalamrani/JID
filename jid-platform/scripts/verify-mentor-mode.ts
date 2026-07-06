/**
 * Section 4.1 — mentor mode must not change profiles.role or gate Job Board / Radar.
 * Run: pnpm tsx scripts/verify-mentor-mode.ts
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

const hook = read('src/lib/hooks/use-mentor-mode.ts')
const switcher = read('src/components/shared/profile-switcher.tsx')
const hasRole = read('src/lib/mentor-mode/has-mentor-role.ts')
const cookies = read('src/lib/mentor-mode/cookies.ts')
const middleware = read('src/middleware.ts')
const guards = read('src/lib/auth/guards.ts')
const rbac = read('src/lib/auth/rbac.ts')

// Task 4 — mode switch does not touch profiles.role
check(!hook.includes("role = 'mentor'"), 'use-mentor-mode does not set profiles.role')
check(!hook.includes(".from('profiles')"), 'use-mentor-mode does not query profiles table')
check(hook.includes("from('mentor_profiles')"), 'use-mentor-mode refresh uses mentor_profiles')
check(hook.includes('writeProfileModeCookie'), 'mode persisted via cookie only')

check(hasRole.includes("from('mentor_profiles')"), 'hasMentorRole uses mentor_profiles')
check(hasRole.includes("eq('status', 'approved')"), 'hasMentorRole checks approved status')
check(!hasRole.includes('profiles.role'), 'hasMentorRole never reads profiles.role')

// Job Board / Radar — middleware and guards must not read mode cookie
check(!middleware.includes('jid_profile_mode'), 'middleware ignores profile mode cookie')
check(!guards.includes('jid_profile_mode'), 'route guards ignore profile mode cookie')
check(!rbac.includes('jid_profile_mode'), 'RBAC ignores profile mode cookie')

const jobBoard = read('src/app/[locale]/(public)/opportunities/_components/job-board-page-client.tsx')
check(!jobBoard.includes('useMentorMode'), 'Job Board page does not gate on mentor mode')

const realtime = read('src/lib/hooks/use-realtime-applications.ts')
check(!realtime.includes('useMentorMode'), 'Radar/realtime hook does not gate on mentor mode')

check(switcher.includes('return null'), 'ProfileSwitcher hidden without mentor role')
check(cookies.includes('localStorage') === false, 'mode not stored in localStorage')

console.log('\nMentor mode verification complete.')
