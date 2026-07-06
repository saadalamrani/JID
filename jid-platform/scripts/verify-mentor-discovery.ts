/**
 * Section 4.3 — Mentor discovery verification.
 * Run: pnpm tsx scripts/verify-mentor-discovery.ts
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

const page = read('src/app/[locale]/(public)/mentors/page.tsx')
const queries = read('src/lib/queries/mentors.ts')
const empty = read('src/app/[locale]/(public)/mentors/_components/empty-mentor-state.tsx')
const grid = read('src/app/[locale]/(public)/mentors/_components/virtualized-mentor-grid.tsx')
const api = read('src/app/api/mentors/route.ts')
const notifyApi = read('src/app/api/mentors/notification-request/route.ts')

check(page.includes('fetchMentors'), 'mentors page server-fetches initial data')
check(queries.includes("eq('status', 'approved')"), 'fetchMentors filters approved mentors')
check(queries.includes('is_accepting_requests'), 'stats query uses is_accepting_requests')
check(queries.includes('sessions_count'), 'stats sums sessions_count')
const publicSelect = queries.match(/MENTOR_PUBLIC_SELECT = `([\s\S]*?)`/)?.[1] ?? ''
check(!publicSelect.includes('application_message'), 'public select excludes application_message')
check(!publicSelect.includes('rejection_reason'), 'public select excludes rejection_reason')
check(!publicSelect.includes('declined_requests_count'), 'public select excludes declined_requests_count')

check(grid.includes('useVirtualizedGrid'), 'mentor grid reuses virtualization hook')
check(empty.includes('/api/mentors/notification-request'), 'empty state posts notification request')
check(empty.includes('mentor_notification_requests') === false, 'empty state uses API not direct table')
check(notifyApi.includes("from('mentor_notification_requests')"), 'API inserts notification request')

check(api.includes('parseMentorFiltersFromSearchParams'), 'GET /api/mentors parses filters')
check(read('src/components/filters/sector-filter.tsx').includes('CatalogSectorRef'), 'SectorFilter uses catalog sector type')
check(read('src/app/[locale]/(public)/mentors/_components/sector-filter-control.tsx').includes('useCatalogSectors') === false, 'sector control uses catalog metadata hook via context')

const filterContext = read('src/app/[locale]/(public)/mentors/_components/mentor-filter-context.tsx')
check(filterContext.includes('useCatalogSectors'), 'mentor filters load sectors from catalog metadata')

console.log('\nMentor discovery verification complete.')
