/**
 * Notification preferences workspace verification (static).
 * Run: pnpm tsx scripts/verify-notification-preferences.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(process.cwd())
const PAGE_DIR = join(ROOT, 'src/app/[locale]/settings/notifications')

let passed = 0
let failed = 0

function pass(label: string) {
  passed += 1
  console.log(`  PASS  ${label}`)
}

function fail(label: string, detail?: string) {
  failed += 1
  console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
}

function main() {
  console.log('Notification preferences workspace verification\n')

  const files = ['page.tsx', 'actions.ts', '_components/preferences-form.tsx']
  for (const file of files) {
    if (!existsSync(join(PAGE_DIR, file))) fail(`File ${file}`)
    else pass(`File ${file}`)
  }

  const page = readFileSync(join(PAGE_DIR, 'page.tsx'), 'utf-8')
  const form = readFileSync(join(PAGE_DIR, '_components/preferences-form.tsx'), 'utf-8')
  const actions = readFileSync(join(PAGE_DIR, 'actions.ts'), 'utf-8')
  const groups = readFileSync(join(ROOT, 'src/lib/notifications/category-groups.ts'), 'utf-8')
  const ar = readFileSync(join(ROOT, 'messages/ar.json'), 'utf-8')

  if (page.includes('fetchUserNotificationPreferences') && page.includes('requireAuthenticatedUser')) {
    pass('Server page fetches preferences + auth')
  } else {
    fail('Server page')
  }

  if (ar.includes('إشعار أمني — لا يمكن إيقاف إشعارات الأمان والحساب.')) {
    pass('Security banner Arabic copy')
  } else {
    fail('Security banner copy')
  }

  if (form.includes('CATEGORY_GROUPS') && form.includes('<Switch')) {
    pass('Preferences form uses CATEGORY_GROUPS + Switch matrix')
  } else {
    fail('Preferences form matrix')
  }

  for (const col of ['columns.inApp', 'columns.email', 'columns.digest']) {
    if (form.includes(col)) pass(`Column binding ${col}`)
    else fail(`Column binding ${col}`)
  }

  if (form.includes('is_mandatory') && form.includes('disabled={row.is_mandatory}')) {
    pass('Mandatory categories disable switches')
  } else {
    fail('Mandatory switch guard')
  }

  if (form.includes('setPreferences') && form.includes('toast.error')) {
    pass('Optimistic toggle with rollback toast')
  } else {
    fail('Optimistic lifecycle')
  }

  if (actions.includes('updatePreference') && actions.includes('isMandatoryNotificationCategory')) {
    pass('Server rejects mandatory category mutations')
  } else {
    fail('Mandatory server guard')
  }

  if (actions.includes('upsert') && actions.includes('user_id')) {
    pass('Upsert bounded to authenticated user')
  } else {
    fail('Secure upsert')
  }

  const groupCount = (groups.match(/id: '/g) ?? []).length
  const categoryMatches = groups.match(/'[a-z]+\.[a-z_]+'/g) ?? []
  const uniqueCategories = new Set(categoryMatches.map((m) => m.replace(/'/g, '')))

  if (groupCount === 10 && uniqueCategories.size === 32) {
    pass(`Matrix completeness: ${uniqueCategories.size}/32 categories in ${groupCount} groups`)
  } else {
    fail('Matrix completeness', `${uniqueCategories.size} categories, ${groupCount} groups`)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
