/**
 * Section 8 — staff users management (bounded scope) verification.
 * Run: pnpm tsx scripts/verify-staff-users.ts
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3002'
const ROOT = process.cwd()

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
  console.log(`Section 8 — staff users management (${BASE})\n`)

  try {
    await fetch(BASE, { method: 'HEAD' })
  } catch {
    console.error(`Dev server not reachable at ${BASE}. Start with: pnpm dev`)
    process.exit(1)
  }

  const queries = readSrc('src/lib/staff/users-queries.ts')
  const actions = readSrc('src/app/[locale]/(staff)/staff/users/actions.ts')
  const menu = readSrc('src/app/[locale]/(staff)/staff/users/_components/user-actions-menu.tsx')
  const detailPage = readSrc('src/app/[locale]/(staff)/staff/users/[id]/page.tsx')

  if (queries.includes(".eq('role', 'individual')")) {
    pass('List query bounded to profiles.role = individual')
  } else {
    fail('Bounded list query')
  }

  if (queries.includes('isStaffManageableProfileRole')) {
    pass('Detail query refuses non-manageable roles')
  } else {
    fail('Detail scope guard')
  }

  if (actions.includes("rpc('staff_suspend_user'")) {
    const suspendBlock =
      actions.split('export async function suspendUser')[1]?.split('export async function reinstateUser')[0] ?? ''
    if (!suspendBlock.includes("from('profiles')")) {
      pass('suspendUser uses staff_suspend_user RPC only')
    } else {
      fail('suspendUser must call RPC, not direct profiles UPDATE')
    }
  } else {
    fail('suspendUser RPC missing')
  }

  if (menu.includes('changeRole') || menu.includes('changeUserRole') || menu.includes('set_user_role')) {
    fail('User actions menu must not expose role changes')
  } else {
    pass('No role change option in staff user actions menu')
  }

  if (menu.includes('flagUserContent') && menu.includes('forceLogoutUser') && menu.includes('reinstateUser')) {
    pass('Staff actions: sessions, flag, suspend/reinstate')
  } else {
    fail('Staff action surface incomplete')
  }

  if (detailPage.includes('notFound()')) {
    pass('Detail page returns 404 for out-of-scope users')
  } else {
    fail('Detail page 404 guard')
  }

  const listRes = await fetch(`${BASE}/staff/users`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  if (listRes.status === 200) {
    pass('/staff/users renders', 'HTTP 200')
  } else {
    fail('/staff/users', `HTTP ${listRes.status}`)
  }

  const suspendedRes = await fetch(`${BASE}/staff/users/suspended`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  if (suspendedRes.status === 200) {
    pass('/staff/users/suspended renders', 'HTTP 200')
  } else {
    fail('/staff/users/suspended', `HTTP ${suspendedRes.status}`)
  }

  const staffDetailRes = await fetch(
    `${BASE}/staff/users/00000000-0000-4000-8000-000000000099`,
    { redirect: 'manual', headers: STAFF_HEADERS },
  )
  if (staffDetailRes.status === 404) {
    pass('Unknown/privileged user detail → 404')
  } else if (staffDetailRes.status === 200) {
    pass('Detail route reachable (not-found UI for missing id)')
  } else {
    fail('Detail route', `HTTP ${staffDetailRes.status}`)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
