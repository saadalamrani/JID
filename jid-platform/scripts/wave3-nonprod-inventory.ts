/**
 * Wave 3 Step 0 — non-production inventory only.
 * Target lock: hmjuijmaefajdjrjdsxu. Production znfhladafpajyjwcfzvv is forbidden.
 */
import postgres from 'postgres'
import { loadEnvFile } from './lib/p110-env'

const NONPROD_REF = 'hmjuijmaefajdjrjdsxu'
const FORBIDDEN_PROD_REF = 'znfhladafpajyjwcfzvv'

function assertNonprod(url: string, dbUrl: string): void {
  if (url.includes(FORBIDDEN_PROD_REF) || dbUrl.includes(FORBIDDEN_PROD_REF)) {
    throw new Error('PRODUCTION_FORBIDDEN: refused to contact znfhladafpajyjwcfzvv')
  }
  if (!url.includes(NONPROD_REF) || !dbUrl.includes(NONPROD_REF)) {
    throw new Error('NONPROD_IDENTITY_UNPROVEN: URL does not contain hmjuijmaefajdjrjdsxu')
  }
}

async function main(): Promise<void> {
  const env = { ...loadEnvFile('.env.seed.nonprod'), ...process.env }
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const dbUrl = env.SEED_DATABASE_URL ?? ''
  assertNonprod(url, dbUrl)

  const sql = postgres(dbUrl, { max: 1, prepare: false, ssl: 'require' })
  try {
    const identity = await sql`
      select current_database() as db, current_user as usr
    `
    console.log('TARGET_REF', NONPROD_REF)
    console.log('PRODUCTION_TOUCHED', 'NO')
    console.log('CURRENT_DATABASE', identity[0]?.db)
    console.log('CURRENT_USER', identity[0]?.usr)

    const jobs = await sql`
      select
        count(*)::int as total,
        count(*) filter (where status = 'published')::int as published,
        count(*) filter (where status = 'closed')::int as closed,
        count(*) filter (where status = 'draft')::int as draft,
        count(*) filter (where status = 'archived')::int as archived
      from public.jobs
    `
    console.log('NATIVE_JOBS', JSON.stringify(jobs[0]))

    const lammah = await sql`
      select
        count(*)::int as total,
        count(*) filter (where status = 'active')::int as active,
        count(*) filter (where status = 'hidden')::int as hidden,
        count(*) filter (where status = 'superseded')::int as superseded,
        count(*) filter (where status = 'expired')::int as expired,
        count(*) filter (where company_id is not null)::int as mapped_org,
        count(*) filter (where company_id is null)::int as unresolved_org
      from public.lammah_opportunities
    `
    console.log('LAMMAH_OPPORTUNITIES', JSON.stringify(lammah[0]))

    const types = await sql`
      select coalesce(opportunity_type::text, 'null') as opportunity_type, count(*)::int as n
      from public.lammah_opportunities
      group by 1
      order by 2 desc
    `
    console.log('LAMMAH_TYPES', JSON.stringify(types))

    const sources = await sql`
      select
        count(*)::int as total,
        count(*) filter (where approval_state = 'approved')::int as approved,
        count(*) filter (where approval_state = 'candidate')::int as candidate,
        count(*) filter (where approval_state = 'prohibited')::int as prohibited,
        count(*) filter (where is_active)::int as is_active,
        count(*) filter (where suspended_at is not null)::int as suspended
      from public.lammah_sources
    `
    console.log('LAMMAH_SOURCES', JSON.stringify(sources[0]))

    const sourceStates = await sql`
      select approval_state, health_state, count(*)::int as n
      from public.lammah_sources
      group by 1, 2
      order by 3 desc
    `
    console.log('SOURCE_STATES', JSON.stringify(sourceStates))

    const radar = await sql`select count(*)::int as n from public.lammah_radar_items`
    console.log('LAMMAH_RADAR_ITEMS', radar[0]?.n)

    const seedUser = await sql`
      select
        (select count(*)::int from auth.users where email = 'individual-complete@jidseed.test') as seed_individual,
        (select count(*)::int from public.career_evidence ce
           join auth.users u on u.id = ce.subject_id
          where u.email = 'individual-complete@jidseed.test') as seed_career_evidence,
        (select count(*)::int from public.applications a
           join auth.users u on u.id = a.applicant_id
          where u.email = 'individual-complete@jidseed.test') as seed_applications
    `
    console.log('SEED_INDIVIDUAL_RUNTIME', JSON.stringify(seedUser[0]))
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
