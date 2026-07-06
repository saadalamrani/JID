/**
 * Verify DeadlineBar tier mapping (no DB required).
 * Usage: pnpm tsx scripts/verify-deadline-tiers.ts
 */

import {
  computeDeadlineDaysLeft,
  resolveDeadlineUrgencyTier,
} from '../src/lib/jobs/deadline'

const CASES = [10, 8, 7, 5, 3, 2, 1, 0] as const
const EXPECTED: Record<number, string> = {
  10: 'comfortable',
  8: 'comfortable',
  7: 'moderate',
  5: 'moderate',
  3: 'moderate',
  2: 'urgent',
  1: 'urgent',
  0: 'last_day',
}

function addRiyadhDays(base: Date, days: number): string {
  const next = new Date(base)
  next.setUTCDate(next.getUTCDate() + days)
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(next)
  return `${day}T20:59:59.000Z`
}

const now = new Date()
let passed = 0

for (const offset of CASES) {
  const deadline = addRiyadhDays(now, offset)
  const daysLeft = computeDeadlineDaysLeft(deadline, now)
  const tier = resolveDeadlineUrgencyTier(daysLeft)
  const ok = tier === EXPECTED[offset]
  console.log(
    `${ok ? '✓' : '✗'} +${offset}d → daysLeft=${daysLeft}, tier=${tier} (expected ${EXPECTED[offset]})`,
  )
  if (ok) passed += 1
}

if (passed !== CASES.length) {
  process.exit(1)
}

console.log(`\nAll ${CASES.length} deadline tier checks passed.`)
