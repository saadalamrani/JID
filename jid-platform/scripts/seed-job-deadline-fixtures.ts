/**
 * Seed four published jobs with deadlines at 10, 5, 1, and 0 calendar days (Riyadh)
 * to exercise every DeadlineBar color tier on /ar/opportunities.
 *
 * Usage:
 *   pnpm tsx scripts/seed-job-deadline-fixtures.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL (cloud or local).
 */

import { createClient } from '@supabase/supabase-js'
import { addDays } from 'date-fns'
import { computeDeadlineDaysLeft } from '../src/lib/jobs/deadline'

const FIXTURE_SLUG_PREFIX = 'deadline-fixture'

const FIXTURES = [
  { days: 10, title: 'فرصة اختبار — 10 أيام (زيتوني)', level: 'mid' as const },
  { days: 5, title: 'فرصة اختبار — 5 أيام (ذهبي)', level: 'entry' as const },
  { days: 1, title: 'فرصة اختبار — يوم واحد (كهرماني)', level: 'senior' as const },
  { days: 0, title: 'فرصة اختبار — اليوم (أحمر)', level: 'lead' as const },
]

function endOfRiyadhDay(date: Date): string {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  return `${day}T20:59:59.000Z`
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name')
    .eq('entity_state', 'approved')
    .limit(1)
    .maybeSingle()

  if (companyError || !company) {
    console.error('No approved company found:', companyError?.message ?? 'empty')
    process.exit(1)
  }

  const { data: sector } = await supabase.from('sectors').select('id').limit(1).maybeSingle()
  const { data: region } = await supabase.from('regions').select('id').limit(1).maybeSingle()

  const today = new Date()

  for (const fixture of FIXTURES) {
    const deadline = endOfRiyadhDay(addDays(today, fixture.days))
    const slug = `${FIXTURE_SLUG_PREFIX}-${fixture.days}d`
    const daysLeft = computeDeadlineDaysLeft(deadline, today)

    const row = {
      company_id: company.id,
      slug,
      title_ar: fixture.title,
      title_en: `Deadline fixture ${fixture.days}d`,
      description_ar: `وصف اختبار للفرصة بموعد نهائي خلال ${fixture.days} يومًا.`,
      required_skills: ['التواصل', 'إكسل', 'العمل الجماعي'],
      experience_level: fixture.level,
      status: fixture.days <= 3 ? 'closing_soon' : 'published',
      sector_id: sector?.id ?? null,
      region_id: region?.id ?? null,
      city: 'الرياض',
      is_remote: false,
      application_deadline: deadline,
      published_at: new Date().toISOString(),
      applicant_count: fixture.days * 3,
    }

    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('company_id', company.id)
      .eq('slug', slug)

    if (deleteError) {
      console.warn(`Cleanup ${slug}:`, deleteError.message)
    }

    const { error } = await supabase.from('jobs').insert(row)

    if (error) {
      console.error(`Failed ${slug}:`, error.message)
    } else {
      console.log(`✓ ${slug} — deadlineDaysLeft=${daysLeft} (${fixture.title})`)
    }
  }

  console.log('\nOpen /ar/opportunities to verify DeadlineBar tiers.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
