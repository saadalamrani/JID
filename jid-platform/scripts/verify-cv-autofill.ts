/**
 * Section 8 — autofill mapping verification (static analysis).
 * Run: pnpm tsx scripts/verify-cv-autofill.ts
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildAutofillPayload, type AutofillSource } from '../src/lib/cv/autofill-payload'

let passed = 0
let failed = 0

function check(label: string, ok: boolean): void {
  if (ok) {
    passed++
    console.log(`PASS: ${label}`)
  } else {
    failed++
    console.error(`FAIL: ${label}`)
  }
}

const source: AutofillSource = {
  full_name: 'Noura Al-Rashid',
  phone: '+966501234567',
  linkedin_url: 'https://linkedin.com/in/noura',
  university_id: 'uni-1',
  college_id: 'col-1',
  target_regions: ['Riyadh'],
  email: 'noura@example.com',
  universityName: 'جامعة الملك سعود',
  collegeName: 'علوم الحاسب',
  about_me: 'Graduate seeking software roles.',
  profileLocale: 'ar',
}

const payload = buildAutofillPayload(source, 'ar')

const autoFillSrc = readFileSync(resolve(process.cwd(), 'src/lib/cv/auto-fill.ts'), 'utf-8')
const payloadSrc = readFileSync(resolve(process.cwd(), 'src/lib/cv/autofill-payload.ts'), 'utf-8')

check(
  'does not select email from profiles table',
  !/from\('profiles'\)[\s\S]*select\([^)]*\bemail\b/.test(autoFillSrc),
)
check('uses user_verified_emails for email', autoFillSrc.includes('user_verified_emails'))
check('uses auth session email fallback', autoFillSrc.includes('user.email'))
check('joins universities for institution', autoFillSrc.includes("from('universities')"))
check('joins colleges for field_of_study', autoFillSrc.includes("from('colleges')"))
check('country left null in payload (Day 1 missing)', payloadSrc.includes('country: null'))
check('city from target_regions[0]', payload.header.city === 'Riyadh')
check('country left null (Day 1 missing)', payload.header.country === null)
check('linkedin_url copied', payload.header.linkedin_url === source.linkedin_url)
check('summary from about_me', payload.header.summary === source.about_me)
check('education institution from university name', payload.education?.institution_name === source.universityName)
check('education field_of_study from college', payload.education?.field_of_study === source.collegeName)
check('graduation_year not invented', payload.education?.graduation_year == null)
check('gpa not invented', payload.education?.gpa_value == null)

console.log(`\n${passed}/${passed + failed} checks passed`)
process.exit(failed > 0 ? 1 : 0)
