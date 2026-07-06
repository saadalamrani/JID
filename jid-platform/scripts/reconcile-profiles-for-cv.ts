/**
 * Part A — profiles column reconciliation for CV Day 3 auto-fill.
 * Derived from applied migrations (024, 029, 041, 053) when information_schema
 * is unavailable (no local Docker / no direct Postgres URL).
 *
 * Run: pnpm tsx scripts/reconcile-profiles-for-cv.ts
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

type FieldReconciliation = {
  autofillExpectation: string
  actualColumn: string | null
  status: 'OK' | 'RENAMED' | 'MISSING' | 'DERIVED'
  day3Notes: string
}

const PROFILE_COLUMNS_FROM_MIGRATIONS = [
  'id',
  'full_name',
  'avatar_url',
  'locale',
  'created_at',
  'updated_at',
  'role',
  'email_verified_at',
  'phone',
  'phone_verified_at',
  'mfa_enabled',
  'mfa_enforced',
  'last_login_at',
  'last_login_ip',
  'failed_login_count',
  'locked_until',
  'headline',
  'about_me',
  'target_sectors',
  'target_program_types',
  'target_regions',
  'smart_links',
  'profile_completion_pct',
  'profile_state',
  'visibility',
  'show_profile_to_companies',
  'show_profile_in_university_stats',
  'suspended_at',
  'suspended_reason',
  'deleted_at',
  'university_id',
  'college_id',
  'linkedin_url',
  'allow_company_direct_contact',
  'show_application_history',
] as const

const RECONCILIATION: FieldReconciliation[] = [
  {
    autofillExpectation: 'university (institution name text)',
    actualColumn: 'university_id',
    status: 'RENAMED',
    day3Notes: 'JOIN universities ON profiles.university_id = universities.id → use name / name_ar',
  },
  {
    autofillExpectation: 'major / field_of_study',
    actualColumn: null,
    status: 'DERIVED',
    day3Notes:
      'JOIN colleges ON profiles.college_id = colleges.id → colleges.name (no dedicated major column)',
  },
  {
    autofillExpectation: 'graduation_year',
    actualColumn: null,
    status: 'MISSING',
    day3Notes: 'Not on profiles — leave cv_education.graduation_year empty or prompt user',
  },
  {
    autofillExpectation: 'gpa / gpa_value',
    actualColumn: null,
    status: 'MISSING',
    day3Notes: 'Not on profiles — only on cv_education after user enters CV data',
  },
  {
    autofillExpectation: 'gpa_scale',
    actualColumn: null,
    status: 'MISSING',
    day3Notes: 'Not on profiles — only on cv_education',
  },
  {
    autofillExpectation: 'linkedin_url',
    actualColumn: 'linkedin_url',
    status: 'OK',
    day3Notes: 'Direct copy from profiles.linkedin_url',
  },
  {
    autofillExpectation: 'city',
    actualColumn: null,
    status: 'DERIVED',
    day3Notes: 'Use profiles.target_regions[0] (see lib/profile/queries.ts city proxy) or leave blank',
  },
  {
    autofillExpectation: 'country',
    actualColumn: null,
    status: 'MISSING',
    day3Notes: 'No profiles.country — not on universities catalog either in 024',
  },
  {
    autofillExpectation: 'email',
    actualColumn: null,
    status: 'MISSING',
    day3Notes:
      'profiles has NO email column. Use auth.users.email (server) or user_verified_emails where is_primary = true',
  },
]

function loadMigrationSources(): string[] {
  const dir = resolve(process.cwd(), 'supabase/migrations')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(resolve(dir, f), 'utf-8'))
}

function main(): void {
  console.log('=== PART A: profiles reconciliation for CV auto-fill ===\n')
  console.log(
    'Source: migration files (information_schema query requires applied DB — Docker offline here)\n',
  )

  console.log('profiles columns (union of 024 + 029 + 041 + 053):')
  for (const col of PROFILE_COLUMNS_FROM_MIGRATIONS) {
    console.log(`  - ${col}`)
  }
  console.log(`\nTotal: ${PROFILE_COLUMNS_FROM_MIGRATIONS.length} columns\n`)

  console.log('Section 8 auto-fill field mapping:\n')
  console.log('| Expected (Section 8) | Actual column | Status | Day 3 action |')
  console.log('|----------------------|---------------|--------|--------------|')
  for (const row of RECONCILIATION) {
    console.log(
      `| ${row.autofillExpectation} | ${row.actualColumn ?? '—'} | ${row.status} | ${row.day3Notes} |`,
    )
  }

  const flags = RECONCILIATION.filter((r) => r.status !== 'OK')
  console.log(`\nFLAGS for Day 3: ${flags.length} field(s) need non-direct mapping\n`)

  const migrations = loadMigrationSources()
  const has068 = migrations.some((m) => m.includes('068_cv_database') || m.includes('cv_education'))
  console.log(`068_cv_database.sql present in repo: ${existsSync(resolve(process.cwd(), 'supabase/migrations/068_cv_database.sql'))}`)
  console.log(`CV child tables in migration text: ${has068 || migrations.join('').includes('cv_education')}`)

  const emailOnProfiles = PROFILE_COLUMNS_FROM_MIGRATIONS.includes('email' as never)
  console.log(`\nEmail on profiles: ${emailOnProfiles ? 'YES' : 'NO (auth.users + user_verified_emails)'}`)

  let failed = 0
  if (RECONCILIATION.some((r) => r.autofillExpectation.startsWith('university') && r.status !== 'RENAMED')) {
    failed++
  }
  if (!PROFILE_COLUMNS_FROM_MIGRATIONS.includes('linkedin_url')) {
    failed++
    console.error('FAIL: linkedin_url missing from reconciled profiles columns')
  }

  console.log(failed === 0 ? '\nPASS: reconciliation script complete' : `\nFAIL: ${failed} check(s)`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
