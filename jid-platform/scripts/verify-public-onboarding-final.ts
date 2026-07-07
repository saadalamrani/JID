/**
 * Final QA — Public Pages + Onboarding module verification.
 * Usage: pnpm tsx scripts/verify-public-onboarding-final.ts
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ONBOARDING_ANALYTICS_EVENTS } from '../src/lib/analytics/onboarding-events'
import { SITEMAP_STATIC_ROUTES } from '../src/lib/seo/sitemap-routes'
import { buildRobots } from '../src/lib/seo/robots-config'
import { resolveEntityResumePath } from '../src/lib/onboarding/entity-resume'
import { resolveIndividualResumePath } from '../src/lib/onboarding/resume'
import { resolveWelcomeDestination } from '../src/lib/onboarding/welcome-router'
import { needsMentorPostApprovalSetup } from '../src/lib/mentor-hub/needs-post-approval-setup'

const ROOT = process.cwd()

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8')
}

type Check = { label: string; pass: boolean }

const checks: Check[] = []

function check(label: string, pass: boolean) {
  checks.push({ label, pass })
}

const sprintOnboardingSrc = [
  read('src/lib/onboarding/welcome-router.ts'),
  read('src/lib/onboarding/actions.ts'),
  read('src/lib/onboarding/entity-actions.ts'),
  read('src/app/[locale]/(onboarding)/welcome/page.tsx'),
  read('src/app/[locale]/(onboarding)/individual/_components/step-one-form.tsx'),
  read('src/app/[locale]/(onboarding)/company/entity/page.tsx'),
].join('\n')

check(
  'No profiles.role = mentor in sprint onboarding output',
  !sprintOnboardingSrc.includes("role === 'mentor'") &&
    !sprintOnboardingSrc.includes("role: 'mentor'") &&
    !sprintOnboardingSrc.includes('case \'mentor\''),
)

check(
  'Welcome router: individual → step-1 at signup',
  resolveWelcomeDestination('individual') === '/individual/step-1',
)
check(
  'Welcome router: company_admin → entity setup (claim-only)',
  resolveWelcomeDestination('company_admin') === '/company/entity',
)
check(
  'Welcome router: no mentor role branch',
  !read('src/lib/onboarding/welcome-router.ts').includes("role === 'mentor'"),
)

check(
  'Landing has no fabricated stat patterns',
  !read('src/app/[locale]/(public)/_components/landing/problem-statement.tsx').includes('+') &&
    read('messages/en.json').includes('No unsourced statistics'),
)

for (const route of ['/catalog', '/opportunities', '/mentors'] as const) {
  check(`Sitemap includes ${route}`, SITEMAP_STATIC_ROUTES.includes(route))
}

const robotsDisallow = buildRobots().rules
const disallow = Array.isArray(robotsDisallow) ? robotsDisallow[0]?.disallow : robotsDisallow?.disallow
const disallowList = Array.isArray(disallow) ? disallow : []
for (const path of ['/sys', '/staff', '/api'] as const) {
  check(`robots.txt disallows ${path}`, disallowList.includes(path))
}

check(
  'Individual resume mid-flow',
  resolveIndividualResumePath({
    full_name: 'محمد',
    phone: '+966512345678',
    university_id: null,
    graduation_year: null,
    target_sectors: [],
    smart_links: { onboarding: { current_step: 2 } },
    onboarding_completed_at: null,
    onboarding_skipped_at: null,
  }) === '/individual/step-2',
)

check(
  'Entity resume mid-flow',
  resolveEntityResumePath({
    smart_links: { entity_setup: { current_step: 'team' } },
    onboarding_completed_at: null,
    onboarding_skipped_at: null,
  }) === '/company/entity/team',
)

check(
  'Skip sets onboarding_skipped_at',
  read('src/lib/onboarding/actions.ts').includes('onboarding_skipped_at'),
)

const publicPages = ['page.tsx', 'about/page.tsx', 'privacy/page.tsx', 'terms/page.tsx', 'pdpl/page.tsx']
for (const page of publicPages) {
  const src = read(`src/app/[locale]/(public)/${page}`)
  check(`${page} is server component (no use client)`, !src.includes("'use client'"))
}

check(
  'Privacy links to PDPL',
  read('src/app/[locale]/(public)/privacy/page.tsx').includes('href="/pdpl"'),
)
check(
  'Terms links to Privacy',
  read('src/app/[locale]/(public)/terms/page.tsx').includes('href="/privacy"'),
)
check(
  'PDPL links to Privacy and Terms',
  read('src/app/[locale]/(public)/pdpl/page.tsx').includes('href="/privacy"') &&
    read('src/app/[locale]/(public)/pdpl/page.tsx').includes('href="/terms"'),
)

check('Task 1-ALT entity page exists', existsSync(join(ROOT, 'src/app/[locale]/(onboarding)/company/entity/page.tsx')))
check('Entity team page exists', existsSync(join(ROOT, 'src/app/[locale]/(onboarding)/company/entity/team/page.tsx')))
check(
  'Entity actions update existing company only',
  read('src/lib/onboarding/entity-actions.ts').includes('.eq(\'claimed_by\', userId)') &&
    !read('src/lib/onboarding/entity-actions.ts').includes('.insert('),
)
check(
  'Team invites use staff token pattern',
  read('src/lib/entity/invite-team.ts').includes('hashInviteToken'),
)
check(
  'entity_team_invitations migration exists',
  existsSync(join(ROOT, 'supabase/migrations/088_entity_team_invitations.sql')),
)

check(
  'Mentor post-approval setup component exists',
  existsSync(join(ROOT, 'src/app/[locale]/(mentor)/dashboard/_components/mentor-post-approval-setup.tsx')),
)
check(
  'Mentor setup triggers when expertise empty',
  needsMentorPostApprovalSetup(
    {
      is_accepting_requests: true,
      bio_long: null,
      expertise_areas: [],
      preferred_mediums: ['video'],
      slug: null,
      full_name: 'Test',
      avatar_url: null,
      rating_avg: null,
      sessions_count: 0,
      is_mentor_of_month: false,
    },
    null,
  ),
)

check(
  'Onboarding analytics events registered',
  ONBOARDING_ANALYTICS_EVENTS.includes('onboarding_completed') &&
    ONBOARDING_ANALYTICS_EVENTS.includes('entity_setup_completed'),
)
check(
  'Landing tracks landing_page_viewed server-side',
  read('src/app/[locale]/(public)/page.tsx').includes("trackServer('landing_page_viewed'"),
)

function main(): void {
  let failed = 0
  for (const { label, pass } of checks) {
    if (pass) {
      console.log(`PASS: ${label}`)
    } else {
      console.error(`FAIL: ${label}`)
      failed++
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`)
    process.exit(1)
  }

  console.log(`\nAll ${checks.length} final QA checks passed.`)
  console.log('Architecture branch: Task 1-ALT (claim-only company_admin; finish-setup flow on existing catalog entity)')
  console.log('Public Pages + Onboarding module: COMPLETE')
}

main()
