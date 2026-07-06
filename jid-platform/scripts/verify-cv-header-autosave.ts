/**
 * Verifies Section 9 auto-save constants and header patch normalization.
 * Run: pnpm tsx scripts/verify-cv-header-autosave.ts
 */

import { AUTO_SAVE_DEBOUNCE_MS } from '../src/lib/hooks/use-auto-save'
import {
  cvHeaderSectionSchema,
  normalizeCvHeaderPatch,
} from '../src/lib/cv/schemas/header'

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

console.log('CV header auto-save verification\n')

assert(AUTO_SAVE_DEBOUNCE_MS === 800, 'debounce is 800ms')

const valid = cvHeaderSectionSchema.parse({
  full_name: 'Noura Al-Rashid',
  city: 'Riyadh',
  country: 'Saudi Arabia',
  email: 'noura@example.com',
  phone: '+966 50 123 4567',
  linkedin_url: 'https://linkedin.com/in/noura',
  github_url: '',
  portfolio_url: '',
  custom_link_1_label: 'Behance',
  custom_link_1_url: 'https://behance.net/noura',
  custom_link_2_label: '',
  custom_link_2_url: '',
})

const patch = normalizeCvHeaderPatch(valid)
assert(patch.full_name === 'Noura Al-Rashid', 'full_name preserved')
assert(patch.city === 'Riyadh', 'city preserved')
assert(patch.github_url === null, 'empty github_url → null')
assert(patch.custom_link_1_label === 'Behance', 'custom link label preserved')
assert(patch.custom_link_2_url === null, 'empty custom_link_2_url → null')

const invalid = cvHeaderSectionSchema.safeParse({
  full_name: '',
  city: '',
  country: '',
  email: 'not-an-email',
  phone: '',
  linkedin_url: 'bad-url',
  github_url: '',
  portfolio_url: '',
  custom_link_1_label: '',
  custom_link_1_url: '',
  custom_link_2_label: '',
  custom_link_2_url: '',
})
assert(!invalid.success, 'invalid header values rejected by Zod')

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
