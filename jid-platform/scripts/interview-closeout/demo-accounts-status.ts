/**
 * Inspect and patch demo-account presentation on authorized nonprod.
 * Does not print passwords.
 */
import { createClient } from '@supabase/supabase-js'
import { createNonprodSql, loadNonprodEnv } from '../catalog/nonprod-catalog-snapshot'
import { SEED_PASSWORD, SHAREABLE_TEST_ACCOUNTS } from '../lib/seed-safety'

const DEMO_EMAILS = [
  'individual-complete@jidseed.test',
  'business-verified@jidseed.test',
  'university-verified@jidseed.test',
  'staff@jidseed.test',
  'admin@jidseed.test',
] as const

async function main() {
  const execute = process.argv.includes('--execute')
  const env = loadNonprodEnv()
  const sql = createNonprodSql(env)

  const profiles = await sql`
    SELECT p.id, p.full_name, p.role, u.email
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email = ANY(${DEMO_EMAILS as unknown as string[]})
    ORDER BY u.email
  `
  const business = await sql`
    SELECT bp.id, bp.display_name_ar, bp.display_name_en, bp.owner_user_id, bp.status,
           c.slug, c.name
    FROM business_profiles bp
    JOIN companies c ON c.id = bp.directory_id
    WHERE bp.owner_user_id = 'b1000005-0000-4000-8000-000000000005'
  `
  const jobs = await sql`
    SELECT j.id, j.title_ar, j.title_en, j.status, j.business_profile_id, j.created_by,
           (SELECT count(*)::int FROM applications a WHERE a.job_id = j.id) AS applications
    FROM jobs j
    WHERE j.business_profile_id = 'b3000001-0000-4000-8000-000000000001'
       OR j.created_by = 'b1000005-0000-4000-8000-000000000005'
    ORDER BY j.status, j.title_en
  `
  const companies = await sql`
    SELECT id, name, name_ar, slug
    FROM companies
    WHERE id IN (
      'b2000001-0000-4000-8000-000000000001',
      'b2000003-0000-4000-8000-000000000003'
    )
  `
  const university = await sql`
    SELECT id, display_name_ar, display_name_en, owner_user_id, status
    FROM university_profiles
    WHERE owner_user_id = 'b1000007-0000-4000-8000-000000000007'
  `
  const mfa = await sql`
    SELECT u.email, count(f.id)::int AS factor_count
    FROM auth.users u
    LEFT JOIN auth.mfa_factors f ON f.user_id = u.id
    WHERE u.email = ANY(${DEMO_EMAILS as unknown as string[]})
    GROUP BY u.email
    ORDER BY u.email
  `

  console.log(JSON.stringify({ dryRun: !execute, profiles, business, jobs, companies, university, mfa }, null, 2))

  if (execute) {
    await sql`
      UPDATE profiles SET full_name = 'حساب جِد التجريبي', updated_at = now()
      WHERE id = 'b1000001-0000-4000-8000-000000000001'
    `
    await sql`
      UPDATE business_profiles
      SET display_name_ar = 'منشأة جِد التجريبية',
          display_name_en = 'JID Demo Organization',
          updated_at = now()
      WHERE id = 'b3000001-0000-4000-8000-000000000001'
    `
    await sql`
      UPDATE university_profiles
      SET display_name_ar = 'مساحة جامعة تجريبية',
          display_name_en = 'JID Demo University',
          updated_at = now()
      WHERE owner_user_id = 'b1000007-0000-4000-8000-000000000007'
    `
    await sql`
      UPDATE companies
      SET name = 'JID Demo Organization', name_ar = 'منشأة جِد التجريبية', updated_at = now()
      WHERE id = 'b2000001-0000-4000-8000-000000000001'
    `
    await sql`
      UPDATE companies
      SET name = 'JID Demo University', name_ar = 'مساحة جامعة تجريبية', updated_at = now()
      WHERE id = 'b2000003-0000-4000-8000-000000000003'
    `
  }

  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const logins: Array<Record<string, unknown>> = []
  for (const row of SHAREABLE_TEST_ACCOUNTS) {
    if (!DEMO_EMAILS.includes(row.email as (typeof DEMO_EMAILS)[number]) && row.email !== 'individual-new@jidseed.test') {
      continue
    }
    const { data, error } = await client.auth.signInWithPassword({
      email: row.email,
      password: SEED_PASSWORD,
    })
    logins.push({
      email: row.email,
      ok: Boolean(data.user) && !error,
      error: error?.message ?? null,
      aal: data.session?.aal ?? null,
      confirmed: Boolean(data.user?.email_confirmed_at),
    })
    await client.auth.signOut()
  }
  console.log(JSON.stringify({ logins }, null, 2))
  await sql.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
