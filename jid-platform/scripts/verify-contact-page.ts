/**
 * Section 9 — contact page static + rate-limit + validation checks.
 * Usage: pnpm tsx scripts/verify-contact-page.ts
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  assertContactRateLimit,
  ContactRateLimitError,
  resetDevContactRateLimitBuckets,
} from '../src/lib/contact/rate-limit'
import { CONTACT_CATEGORIES, CONTACT_RATE_LIMIT } from '../src/lib/contact/constants'
import { contactFormSchema } from '../src/lib/contact/schema'

const ROOT = process.cwd()

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8')
}

const checks: Array<[string, boolean]> = [
  ['contact page exists', existsSync(join(ROOT, 'src/app/[locale]/(public)/contact/page.tsx'))],
  ['contact form exists', existsSync(join(ROOT, 'src/app/[locale]/(public)/contact/_components/contact-form.tsx'))],
  ['ContactInfoCard exists', existsSync(join(ROOT, 'src/app/[locale]/(public)/contact/_components/contact-info-card.tsx'))],
  ['actions.ts exists', existsSync(join(ROOT, 'src/app/[locale]/(public)/contact/actions.ts'))],
  ['migration 087 exists', existsSync(join(ROOT, 'supabase/migrations/087_onboarding_contact_messages.sql'))],
  ['5 categories defined', CONTACT_CATEGORIES.length === 5],
  ['rate limit 3/hour', CONTACT_RATE_LIMIT.max === 3],
  ['upstash packages in package.json', read('package.json').includes('@upstash/ratelimit')],
  ['react-hook-form in contact form', read('src/app/[locale]/(public)/contact/_components/contact-form.tsx').includes('useForm')],
  ['zod resolver in contact form', read('src/app/[locale]/(public)/contact/_components/contact-form.tsx').includes('zodResolver')],
  ['contact_messages in types', read('src/lib/supabase/types.ts').includes('contact_messages')],
  ['i18n ar contactPage', read('messages/ar.json').includes('"contactPage"')],
  ['arabic email validation message', read('messages/ar.json').includes('بريد إلكتروني غير صالح')],
]

async function main(): Promise<void> {
  let failed = 0
  for (const [label, ok] of checks) {
    if (!ok) {
      console.error(`FAIL: ${label}`)
      failed++
    } else {
      console.log(`PASS: ${label}`)
    }
  }

  const invalidEmail = contactFormSchema.safeParse({
    full_name: 'Test User',
    email: 'not-an-email',
    category: 'general',
    subject: 'Hello',
    body: 'This is a long enough message body.',
  })
  if (
    !invalidEmail.success &&
    invalidEmail.error.issues[0]?.message === 'contactPage.validation.emailInvalid'
  ) {
    console.log('PASS: invalid email returns i18n validation key')
  } else {
    console.error('FAIL: invalid email Zod validation key')
    failed++
  }

  resetDevContactRateLimitBuckets()
  const ip = 'verify-test-ip'
  let rateLimited = false
  try {
    await assertContactRateLimit(ip)
    await assertContactRateLimit(ip)
    await assertContactRateLimit(ip)
    await assertContactRateLimit(ip)
  } catch (error) {
    rateLimited = error instanceof ContactRateLimitError
  }

  if (rateLimited) {
    console.log('PASS: 4th message within hour is rate limited (dev bucket)')
  } else {
    console.error('FAIL: rate limit did not block 4th message')
    failed++
  }

  if (failed > 0) {
    process.exit(1)
  }

  console.log(`\nAll contact page checks passed (${checks.length + 2} total).`)
}

void main()
