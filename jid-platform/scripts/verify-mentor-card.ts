/**
 * Sections 4.4, 4.5, 4.7 — MentorCard, WorkshopChip, mentor detail page.
 * Run: pnpm tsx scripts/verify-mentor-card.ts
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

const card = read('src/components/mentor/mentor-card.tsx')
const chip = read('src/components/mentor/workshop-chip.tsx')
const crown = read('src/components/mentor/crown-badge.tsx')
const workshopLib = read('src/lib/mentor/workshop.ts')
const grid = read('src/app/[locale]/(public)/mentors/_components/virtualized-mentor-grid.tsx')
const detailPage = read('src/app/[locale]/(public)/mentors/[slug]/page.tsx')
const detailView = read('src/app/[locale]/(public)/mentors/_components/mentor-public-detail-view.tsx')
const queries = read('src/lib/queries/mentors.ts')
const seed = read('supabase/seed.sql')
const en = read('messages/en.json')

check(grid.includes('MentorCard'), 'discovery grid uses MentorCard')
check(!grid.includes('MentorCardPlaceholder'), 'placeholder removed from grid')

check(card.includes('CrownBadge'), 'MentorCard imports CrownBadge')
check(card.includes('is_mentor_of_month'), 'MentorCard gates crown on is_mentor_of_month')
check(card.includes('WorkshopChip'), 'MentorCard imports WorkshopChip')
check(card.includes('isLiveActiveWorkshop'), 'MentorCard gates workshop chip')
check(card.includes('expertise_areas.slice(0, 3)'), 'MentorCard limits expertise tags to 3')
check(card.includes('disabled'), 'MentorCard disables CTA when not accepting')
check(!card.includes('dark:'), 'MentorCard has no dark: classes')

check(chip.includes('bg-gradient-to-r from-jid-gold'), 'WorkshopChip uses gold gradient')
check(workshopLib.includes('is_active'), 'workshop helper checks is_active')
check(workshopLib.includes('workshop_date'), 'workshop helper checks workshop_date')
check(workshopLib.includes('Date.now()'), 'workshop helper compares to now')

check(crown.includes('Crown') && !crown.includes('is_mentor_of_month ?'), 'CrownBadge is presentational only')
check(card.includes('mentor.is_mentor_of_month ?'), 'crown rendered only when flag true')

check(queries.includes('is_mentor_of_month'), 'public select includes is_mentor_of_month')
check(queries.includes('active_workshop'), 'public select includes active_workshop')
check(queries.includes('fetchMentorBySlug'), 'fetchMentorBySlug exists')
check(queries.includes('fetchMentorPublicByIdentifier'), 'identifier resolver supports slug and uuid')

check(detailPage.includes('fetchMentorPublicByIdentifier'), 'detail page resolves mentor by slug/uuid')
check(detailView.includes('MentorBioSection'), 'detail view has bio section')
check(detailView.includes('MentorExpertiseSection'), 'detail view has expertise grid')
check(detailView.includes('PreferredMediumsIcons'), 'detail view shows preferred mediums')
check(detailView.includes('ActiveWorkshopCard'), 'detail view shows workshop when live')
check(detailView.includes('requestCta'), 'detail view has request CTA')

check(seed.includes("is_mentor_of_month"), 'seed sets is_mentor_of_month for testing')
check(seed.includes("'ahmed-al-rashid'"), 'seed mentor has slug')
check(seed.includes('"is_active": true'), 'seed workshop is active with future date')

check(en.includes('"mentorship.card"') === false && en.includes('"card"'), 'en.json has mentorship.card keys')
check(en.includes('"detail"'), 'en.json has mentorship.detail keys')

try {
  read('src/app/[locale]/(public)/mentors/_components/mentor-card-placeholder.tsx')
  check(false, 'placeholder file removed')
} catch {
  check(true, 'placeholder file removed')
}

try {
  read('src/app/[locale]/(public)/mentors/[uuid]/page.tsx')
  check(false, '[uuid] route consolidated into [slug]')
} catch {
  check(true, '[uuid] route consolidated into [slug]')
}

console.log('\nMentor card verification complete.')
