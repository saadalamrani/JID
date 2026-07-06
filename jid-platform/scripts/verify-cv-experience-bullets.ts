/**
 * Verifies Section 7.8 experience bullets normalize to ordered TEXT[].
 * Run: pnpm tsx scripts/verify-cv-experience-bullets.ts
 */

import {
  cvExperienceEntrySchema,
  normalizeBullets,
  normalizeExperienceUpdate,
} from '../src/lib/cv/schemas/experience'

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${label}`)
  } else {
    failed += 1
    console.error(`  FAIL  ${label}`)
  }
}

console.log('CV experience bullets verification\n')

const threeBullets = [
  'Built dashboard components in React',
  'Reduced API payload by 18%',
  'Automated regression checks for payment flows',
]

const entry = cvExperienceEntrySchema.parse({
  company_name: 'Saudi Digital Bank',
  company_city: 'Riyadh',
  company_country: 'Saudi Arabia',
  job_title: 'Software Engineering Intern',
  employment_type: 'Internship',
  start_month: 6,
  start_year: 2024,
  end_month: 8,
  end_year: 2024,
  is_current: false,
  bullets: threeBullets,
  sort_order: 0,
})

const patch = normalizeExperienceUpdate(entry)
assert(patch.bullets?.length === 3, 'three bullets preserved')
assert(patch.bullets?.[0] === threeBullets[0], 'first bullet order preserved')
assert(patch.bullets?.[1] === threeBullets[1], 'second bullet order preserved')
assert(patch.bullets?.[2] === threeBullets[2], 'third bullet order preserved')

const withGaps = normalizeBullets([
  'First achievement',
  '',
  '  ',
  'Second achievement',
  'Third achievement',
])
assert(withGaps.length === 3, 'empty bullets stripped')
assert(withGaps.join('|') === 'First achievement|Second achievement|Third achievement', 'order compacted')

const middleRemoved = normalizeBullets([
  threeBullets[0],
  threeBullets[2],
])
assert(middleRemoved.length === 2, 'middle bullet removal yields 2 items')
assert(middleRemoved[0] === threeBullets[0], 'first bullet unchanged after middle removal')
assert(middleRemoved[1] === threeBullets[2], 'third bullet shifts to index 1')

const currentEntry = cvExperienceEntrySchema.parse({
  ...entry,
  is_current: true,
  end_month: null,
  end_year: null,
})
const currentPatch = normalizeExperienceUpdate(currentEntry)
assert(currentPatch.end_month === null, 'is_current clears end_month')
assert(currentPatch.end_year === null, 'is_current clears end_year')

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
