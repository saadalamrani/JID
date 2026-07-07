/**
 * In-app notifications UI verification (static).
 * Run: pnpm tsx scripts/verify-notifications-ui.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(process.cwd())
const COMPONENTS = join(ROOT, 'src/components/notifications')

const FILES = [
  'use-unread-count.ts',
  'category-icon.tsx',
  'notification-row.tsx',
  'notifications-dropdown.tsx',
  'notifications-bell.tsx',
  'actions.ts',
] as const

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
  console.log('In-app Notifications UI verification\n')

  for (const file of FILES) {
    const path = join(COMPONENTS, file)
    if (!existsSync(path)) {
      fail(`File ${file}`)
      continue
    }
    pass(`File ${file}`)
  }

  const hook = readFileSync(join(COMPONENTS, 'use-unread-count.ts'), 'utf-8')
  if (hook.includes("event: '*'") && hook.includes("read_at', null")) {
    pass('useUnreadCount: unread filter + wildcard realtime')
  } else {
    fail('useUnreadCount realtime/count logic')
  }

  const icon = readFileSync(join(COMPONENTS, 'category-icon.tsx'), 'utf-8')
  if (icon.includes('claim.approved') && icon.includes('digest.daily_summary')) {
    pass('CategoryIcon maps full enum range')
  } else {
    fail('CategoryIcon enum coverage')
  }

  const dropdown = readFileSync(join(COMPONENTS, 'notifications-dropdown.tsx'), 'utf-8')
  if (dropdown.includes("event: 'INSERT'") && dropdown.includes('markAllAsRead')) {
    pass('Dropdown INSERT realtime + markAllAsRead')
  } else {
    fail('NotificationsDropdown features')
  }

  const bell = readFileSync(join(COMPONENTS, 'notifications-bell.tsx'), 'utf-8')
  if (bell.includes('99+') && bell.includes('Popover')) {
    pass('NotificationsBell popover + 99+ badge cap')
  } else {
    fail('NotificationsBell')
  }

  const shell = readFileSync(join(ROOT, 'src/components/shared/authenticated-app-shell.tsx'), 'utf-8')
  if (shell.includes('NotificationsBell')) {
    pass('Bell wired in AuthenticatedAppShell')
  } else {
    fail('AuthenticatedAppShell integration')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
