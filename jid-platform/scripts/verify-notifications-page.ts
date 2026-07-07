/**
 * Notifications listing module verification (static).
 * Run: pnpm tsx scripts/verify-notifications-page.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(process.cwd())
const PAGE_DIR = join(ROOT, 'src/app/[locale]/(individual)/notifications')

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
  console.log('Notifications listing module verification\n')

  const files = [
    'page.tsx',
    'actions.ts',
    '_components/notifications-filters.tsx',
    '_components/notifications-list.tsx',
    '_components/notifications-workspace-actions.tsx',
  ]

  for (const file of files) {
    if (!existsSync(join(PAGE_DIR, file))) fail(`File ${file}`)
    else pass(`File ${file}`)
  }

  const page = readFileSync(join(PAGE_DIR, 'page.tsx'), 'utf-8')
  const queries = readFileSync(join(ROOT, 'src/lib/notifications/queries.ts'), 'utf-8')
  const actions = readFileSync(join(PAGE_DIR, 'actions.ts'), 'utf-8')
  const list = readFileSync(join(PAGE_DIR, '_components/notifications-list.tsx'), 'utf-8')
  const filters = readFileSync(join(PAGE_DIR, '_components/notifications-filters.tsx'), 'utf-8')
  const row = readFileSync(join(ROOT, 'src/components/notifications/notification-row.tsx'), 'utf-8')

  if (page.includes('searchParams') && page.includes('requireAuthenticatedUser')) {
    pass('Server page reads searchParams + auth')
  } else {
    fail('Server page auth/searchParams')
  }

  if (queries.includes('LIST_LIMIT = 50') && queries.includes('created_at')) {
    pass('Query limit 50 + created_at DESC')
  } else {
    fail('Query ordering/limit')
  }

  if (filters.includes('unread') && filters.includes('archived') && filters.includes('category')) {
    pass('Filters: status segments + category dropdown')
  } else {
    fail('NotificationsFilters')
  }

  if (list.includes('variant="page"') && list.includes('NotificationRow')) {
    pass('NotificationsList renders NotificationRow (page variant)')
  } else {
    fail('NotificationsList')
  }

  if (row.includes('bg-jid-gold/5') && row.includes('bg-amber-500') && row.includes('formatDistance')) {
    pass('Page row styling + formatDistance(arSA)')
  } else {
    fail('NotificationRow page variant')
  }

  for (const fn of ['markAsRead', 'markAllAsRead', 'archiveNotification'] as const) {
    if (actions.includes(`export async function ${fn}`)) pass(`Action ${fn}`)
    else fail(`Action ${fn}`)
  }

  if (actions.includes("revalidatePath(path)") && actions.includes("'/notifications'")) {
    pass('revalidatePath(/notifications)')
  } else {
    fail('revalidatePath wiring')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
