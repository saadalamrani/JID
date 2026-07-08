/**
 * Section 10 — onboarding shell + corrected welcome router checks.
 * Usage: pnpm tsx scripts/verify-onboarding.ts
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ONBOARDING_FLOWS } from '../src/lib/onboarding/constants'
import {
  isOnboardingFinished,
  resolveWelcomeDestination,
} from '../src/lib/onboarding/welcome-router'
import {
  resolveIndividualResumePath,
  resolveIndividualResumeStep,
} from '../src/lib/onboarding/resume'
import { saudiPhoneSchema } from '../src/lib/validations/onboarding'

const ROOT = process.cwd()

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8')
}

const constantsSource = read('src/lib/onboarding/constants.ts')
const progressSource = read('src/app/[locale]/(onboarding)/_components/onboarding-progress.tsx')
const welcomeRouterSource = read('src/lib/onboarding/welcome-router.ts')
const welcomePageSource = read('src/app/[locale]/(onboarding)/welcome/page.tsx')
const actionsSource = read('src/lib/onboarding/actions.ts')
const validationsSource = read('src/lib/validations/onboarding.ts')

const profileStep2Done = {
  full_name: 'محمد',
  phone: '+966512345678',
  university_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  graduation_year: 2024,
  target_sectors: [] as string[],
  smart_links: { onboarding: { current_step: 3, degree: 'BSc' } },
  onboarding_completed_at: null,
  onboarding_skipped_at: null,
}

const checks: Array<[string, boolean]> = [
  ['onboarding layout exists', existsSync(join(ROOT, 'src/app/[locale]/(onboarding)/layout.tsx'))],
  ['onboarding-progress exists', existsSync(join(ROOT, 'src/app/[locale]/(onboarding)/_components/onboarding-progress.tsx'))],
  ['skip-for-now exists', existsSync(join(ROOT, 'src/app/[locale]/(onboarding)/_components/skip-for-now.tsx'))],
  ['welcome page exists', existsSync(join(ROOT, 'src/app/[locale]/(onboarding)/welcome/page.tsx'))],
  ['individual step-1 exists', existsSync(join(ROOT, 'src/app/[locale]/(onboarding)/individual/step-1/page.tsx'))],
  ['individual step-2 exists', existsSync(join(ROOT, 'src/app/[locale]/(onboarding)/individual/step-2/page.tsx'))],
  ['individual step-3 exists', existsSync(join(ROOT, 'src/app/[locale]/(onboarding)/individual/step-3/page.tsx'))],
  ['individual complete exists', existsSync(join(ROOT, 'src/app/[locale]/(onboarding)/individual/complete/page.tsx'))],
  ['step-one-form exists', existsSync(join(ROOT, 'src/app/[locale]/(onboarding)/individual/_components/step-one-form.tsx'))],
  ['step-two-form uses universities_catalog', read('src/app/[locale]/(onboarding)/individual/_components/step-two-form.tsx').includes('useUniversitiesCatalog')],
  ['step-three-form uses SectorFilter', read('src/app/[locale]/(onboarding)/individual/_components/step-three-form.tsx').includes('SectorFilter')],
  ['bilingualNameSchema used in onboarding', validationsSource.includes('bilingualNameSchema')],
  ['saudiPhoneSchema exported', validationsSource.includes('export const saudiPhoneSchema')],
  ['saveStepOne action', actionsSource.includes('export async function saveStepOne')],
  ['saveStepTwo action', actionsSource.includes('export async function saveStepTwo')],
  ['saveStepThree action', actionsSource.includes('export async function saveStepThree')],
  ['markOnboardingComplete action', actionsSource.includes('export async function markOnboardingComplete')],
  ['welcome notification TODO skip', actionsSource.includes('platform.announcement') && actionsSource.includes('TODO')],
  ['resume path step-2 after step-1 data', resolveIndividualResumeStep({
    full_name: 'محمد',
    phone: '+966512345678',
    university_id: null,
    graduation_year: null,
    target_sectors: [],
    smart_links: { onboarding: { current_step: 2 } },
    onboarding_completed_at: null,
    onboarding_skipped_at: null,
  }) === 2],
  ['resume path step-3 after education', resolveIndividualResumeStep(profileStep2Done) === 3],
  ['resume path complete after step-3', resolveIndividualResumeStep({
    ...profileStep2Done,
    smart_links: {
      onboarding: { current_step: 'complete', degree: 'BSc', step_three_saved_at: '2026-07-07T00:00:00.000Z' },
    },
  }) === 'complete'],
  ['resume URL uses step path', resolveIndividualResumePath(profileStep2Done) === '/individual/step-3'],
  ['dashboard redirect page exists', existsSync(join(ROOT, 'src/app/[locale]/dashboard/page.tsx'))],
  ['FLOWS has individual', 'individual' in ONBOARDING_FLOWS],
  ['FLOWS has company', 'company' in ONBOARDING_FLOWS],
  ['FLOWS has no mentor key', !('mentor' in ONBOARDING_FLOWS)],
  ['constants source has no mentor flow', !constantsSource.includes("mentor:")],
  ['progress source has no mentor branch', !progressSource.includes("'mentor'") && !progressSource.includes('"mentor"')],
  ['welcome router has no mentor case', !welcomeRouterSource.includes("role === 'mentor'") && !welcomeRouterSource.includes('case \'mentor\'')],
  ['welcome page uses resolveWelcomeDestination', welcomePageSource.includes('resolveWelcomeDestination')],
  ['skip action sets onboarding_skipped_at', actionsSource.includes('onboarding_skipped_at')],
  ['skip dialog uses skipConfirm', read('src/app/[locale]/(onboarding)/_components/skip-for-now.tsx').includes("t('skipConfirm')")],
  ['profiles types include onboarding columns', read('src/lib/supabase/types.ts').includes('onboarding_skipped_at')],
  ['guards include welcome route', read('src/lib/auth/guards.ts').includes('onboarding-welcome')],
  ['shell hides onboarding top bar', read('src/components/shared/authenticated-app-shell.tsx').includes('ONBOARDING_SHELL_PREFIXES')],
  ['i18n en onboarding.shell', read('messages/en.json').includes('"onboarding"')],
  ['i18n ar skipConfirm', read('messages/ar.json').includes('skipConfirm')],
  ['individual → step-1', resolveWelcomeDestination('individual') === '/individual/step-1'],
  ['company_admin → company entity', resolveWelcomeDestination('company_admin') === '/company/entity'],
  ['university_admin → company entity', resolveWelcomeDestination('university_admin') === '/company/entity'],
  ['entity default → dashboard', resolveWelcomeDestination('entity') === '/dashboard'],
  ['finished onboarding → dashboard path in welcome', welcomePageSource.includes("redirect('/dashboard')")],
  [
    'isOnboardingFinished when skipped',
    isOnboardingFinished({
      role: 'individual',
      onboarding_completed_at: null,
      onboarding_skipped_at: '2026-07-07T00:00:00.000Z',
    }),
  ],
  [
    'isOnboardingFinished when completed',
    isOnboardingFinished({
      role: 'individual',
      onboarding_completed_at: '2026-07-07T00:00:00.000Z',
      onboarding_skipped_at: null,
    }),
  ],
  [
    'fresh individual not finished',
    !isOnboardingFinished({
      role: 'individual',
      onboarding_completed_at: null,
      onboarding_skipped_at: null,
    }),
  ],
]

function main(): void {
  let failed = 0
  for (const [label, ok] of checks) {
    if (!ok) {
      console.error(`FAIL: ${label}`)
      failed++
    } else {
      console.log(`PASS: ${label}`)
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`)
    process.exit(1)
  }

  console.log(`\nAll ${checks.length} onboarding checks passed.`)
}

main()
