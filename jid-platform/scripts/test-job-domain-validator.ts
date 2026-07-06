/**
 * Section 6.5 — verify domain mismatch returns exact Arabic error copy.
 * Run: pnpm tsx scripts/test-job-domain-validator.ts
 */

import {
  DOMAIN_MISMATCH_ERROR_AR,
  validateDomainMatch,
} from '../src/lib/jobs/domain-validator'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('FAIL:', message)
    process.exit(1)
  }
}

const companyDomains = ['acme.com', 'acme.sa']

// Valid subdomain match
const ok = validateDomainMatch('https://careers.acme.com/jobs/1', companyDomains, 'ar')
assert(ok.valid === true, 'subdomain should match')

// Invalid domain — exact Section 6.5 message
const bad = validateDomainMatch('https://evil-other.com/apply', companyDomains, 'ar')
assert(bad.valid === false, 'foreign domain should fail')

if (!bad.valid) {
  const expected = DOMAIN_MISMATCH_ERROR_AR.replace('{domains}', 'acme.com، acme.sa')
  assert(
    bad.message === expected,
    `expected exact Arabic error.\n  got:      ${bad.message}\n  expected: ${expected}`,
  )
  console.log('PASS: server rejects with exact Section 6.5 message:')
  console.log(`  ${bad.message}`)
}

// career_portal_url style mismatch (user test scenario)
const careerPortal = validateDomainMatch(
  'https://jobs.random-company.org/openings',
  companyDomains,
  'ar',
)
assert(careerPortal.valid === false, 'career portal on wrong domain should fail')

console.log('All domain validator checks passed.')
