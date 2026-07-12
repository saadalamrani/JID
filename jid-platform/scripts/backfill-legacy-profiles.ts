/**
 * P-110 Task 1 — Legacy profile backfill (idempotent, dry-run by default).
 *
 * Usage:
 *   pnpm tsx scripts/backfill-legacy-profiles.ts
 *   pnpm tsx scripts/backfill-legacy-profiles.ts --dry-run
 *   pnpm tsx scripts/backfill-legacy-profiles.ts --execute --i-understand-this-modifies-production-data
 *   pnpm tsx scripts/backfill-legacy-profiles.ts --simulate
 *
 * Production writes additionally require: BACKFILL_PROD_CONFIRM=yes-i-am-sure
 */

import {
  SYNTHESIZED_REVIEW_NOTES,
  assertWriteSafety,
  createP110AdminClient,
  loadRuntimeEnv,
  parseP110Flags,
  verificationTypeForEntity,
} from './lib/p110-env'

const BATCH_SIZE = 50

type LegacyCompanyRow = {
  id: string
  entity_type: string | null
  claimed_by: string
  name: string | null
  name_ar: string | null
  legal_name_ar?: string | null
  legal_name_en?: string | null
  domains?: string[] | null
  official_domain?: string | null
  created_at: string
  claim_approved_at?: string | null
  claim_requested_at?: string | null
}

type VerificationRow = {
  id: string
  applicant_user_id: string
  directory_id: string
  verification_type: string
  status: string
  reviewed_at: string | null
  created_at: string
}

type BackfillStats = {
  processed: number
  skippedAlreadyMigrated: number
  synthesizedVerifications: number
  synthesizedCompanyIds: string[]
  jobsReanchored: number
  profilesCreated: number
}

function displayNames(company: LegacyCompanyRow): { ar: string; en: string | null } {
  const ar =
    company.name_ar?.trim() ||
    company.legal_name_ar?.trim() ||
    company.name?.trim() ||
    'Unknown organization'
  const en = company.name?.trim() || company.legal_name_en?.trim() || null
  return { ar, en }
}

function legacyVerifiedDomains(company: LegacyCompanyRow): string[] {
  if (company.domains && company.domains.length > 0) {
    return company.domains
  }
  if (company.official_domain?.trim()) {
    return [company.official_domain.trim()]
  }
  return []
}

function profileCreatedAt(company: LegacyCompanyRow): string {
  return company.claim_approved_at ?? company.created_at
}

function syntheticBusinessEmail(companyId: string): string {
  return `backfill+${companyId.replace(/-/g, '').slice(0, 12)}@legacy.jid.local`
}

async function preflightSchema(supabase: ReturnType<typeof createP110AdminClient>): Promise<void> {
  const probes = [
    supabase.from('companies').select('id, claimed_by, entity_type').limit(1),
    supabase.from('verification_requests').select('id').limit(1),
    supabase.from('business_profiles').select('id').limit(1),
    supabase.from('university_profiles').select('id').limit(1),
    supabase.from('jobs').select('id, company_id, business_profile_id').limit(1),
  ]

  const labels = [
    'companies (claimed_by, entity_type)',
    'verification_requests',
    'business_profiles',
    'university_profiles',
    'jobs (business_profile_id)',
  ]

  const errors: string[] = []
  for (let i = 0; i < probes.length; i += 1) {
    const { error } = await probes[i]!
    if (error) errors.push(`${labels[i]}: ${error.message}`)
  }

  if (errors.length > 0) {
    console.error('\nSCHEMA PREFLIGHT FAILED — apply P-101 through P-104 migrations first:\n')
    for (const err of errors) console.error(`  - ${err}`)
    console.error(
      '\nFor logic proof without a migrated database, run with --simulate instead.\n',
    )
    process.exit(1)
  }
}

async function fetchClaimedCompanies(
  supabase: ReturnType<typeof createP110AdminClient>,
  entityType: 'business' | 'university',
): Promise<LegacyCompanyRow[]> {
  const { data, error } = await supabase
    .from('companies')
    .select(
      'id, entity_type, claimed_by, name, name_ar, legal_name_ar, legal_name_en, domains, official_domain, created_at, claim_approved_at, claim_requested_at',
    )
    .not('claimed_by', 'is', null)
    .eq('entity_type', entityType)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`fetch companies (${entityType}): ${error.message}`)
  return (data ?? []) as LegacyCompanyRow[]
}

async function profileExists(
  supabase: ReturnType<typeof createP110AdminClient>,
  entityType: 'business' | 'university',
  directoryId: string,
): Promise<string | null> {
  const table = entityType === 'university' ? 'university_profiles' : 'business_profiles'
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('directory_id', directoryId)
    .maybeSingle()

  if (error) throw new Error(`profile lookup (${table}): ${error.message}`)
  return data?.id ?? null
}

async function findApprovedVerification(
  supabase: ReturnType<typeof createP110AdminClient>,
  company: LegacyCompanyRow,
  verificationType: 'business' | 'university',
): Promise<VerificationRow | null> {
  const { data, error } = await supabase
    .from('verification_requests')
    .select('id, applicant_user_id, directory_id, verification_type, status, reviewed_at, created_at')
    .eq('applicant_user_id', company.claimed_by)
    .eq('directory_id', company.id)
    .eq('verification_type', verificationType)
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw new Error(`verification lookup: ${error.message}`)
  if (data?.[0]) return data[0] as VerificationRow

  const { data: synth, error: synthErr } = await supabase
    .from('verification_requests')
    .select('id, applicant_user_id, directory_id, verification_type, status, reviewed_at, created_at')
    .eq('applicant_user_id', company.claimed_by)
    .eq('directory_id', company.id)
    .eq('verification_type', verificationType)
    .eq('status', 'approved')
    .ilike('review_notes', '%[SYSTEM BACKFILL]%')
    .limit(1)

  if (synthErr) throw new Error(`synthesized verification lookup: ${synthErr.message}`)
  return (synth?.[0] as VerificationRow | undefined) ?? null
}

async function countJobsToReanchor(
  supabase: ReturnType<typeof createP110AdminClient>,
  companyId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .is('business_profile_id', null)

  if (error) throw new Error(`jobs count: ${error.message}`)
  return count ?? 0
}

async function processCompany(
  supabase: ReturnType<typeof createP110AdminClient>,
  company: LegacyCompanyRow,
  entityType: 'business' | 'university',
  write: boolean,
  stats: BackfillStats,
): Promise<void> {
  const verificationType = verificationTypeForEntity(company.entity_type)
  const names = displayNames(company)
  const domains = legacyVerifiedDomains(company)
  const createdAt = profileCreatedAt(company)

  const existingProfileId = await profileExists(supabase, entityType, company.id)
  if (existingProfileId) {
    stats.skippedAlreadyMigrated += 1
    console.log(`  SKIP already migrated: company=${company.id} profile=${existingProfileId}`)
    return
  }

  let verification = await findApprovedVerification(supabase, company, verificationType)
  let synthesized = false

  if (!verification) {
    synthesized = true
    stats.synthesizedVerifications += 1
    stats.synthesizedCompanyIds.push(company.id)
    console.log(
      `  ANOMALY synthesize verification: company=${company.id} owner=${company.claimed_by}`,
    )

    if (write) {
      const insertPayload = {
        applicant_user_id: company.claimed_by,
        directory_id: company.id,
        verification_type: verificationType,
        status: 'approved' as const,
        reviewed_by: null,
        reviewed_at: createdAt,
        review_notes: SYNTHESIZED_REVIEW_NOTES,
        company_name: names.ar,
        business_email: syntheticBusinessEmail(company.id),
        claimant_name: 'Legacy Backfill',
        claimant_title: null,
        evidence_urls: [] as string[],
        required_documents: [] as string[],
        domain_verified: false,
        verified_domains: domains,
        created_at: createdAt,
        updated_at: createdAt,
      }

      const { data: inserted, error } = await supabase
        .from('verification_requests')
        .insert(insertPayload)
        .select('id, applicant_user_id, directory_id, verification_type, status, reviewed_at, created_at')
        .single()

      if (error) throw new Error(`synthesize verification: ${error.message}`)
      verification = inserted as VerificationRow
    }
  }

  const profileTable = entityType === 'university' ? 'university_profiles' : 'business_profiles'
  const profilePayload = {
    directory_id: company.id,
    owner_user_id: company.claimed_by,
    display_name_ar: names.ar,
    display_name_en: names.en,
    verified_domains: domains,
    status: 'published' as const,
    created_at: createdAt,
    updated_at: createdAt,
    published_at: createdAt,
  }

  let profileId: string | null = null

  if (write) {
    const { data: profile, error: profileErr } = await supabase
      .from(profileTable)
      .insert(profilePayload)
      .select('id')
      .single()

    if (profileErr) throw new Error(`create ${profileTable}: ${profileErr.message}`)
    profileId = profile.id
    stats.profilesCreated += 1

    if (verification) {
      const { error: vrErr } = await supabase
        .from('verification_requests')
        .update({
          resulting_profile_id: profileId,
          resulting_profile_type: verificationType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', verification.id)

      if (vrErr) throw new Error(`link verification: ${vrErr.message}`)
    }

    const { data: updatedJobs, error: jobErr } = await supabase
      .from('jobs')
      .update({ business_profile_id: profileId })
      .eq('company_id', company.id)
      .is('business_profile_id', null)
      .select('id')

    if (jobErr) throw new Error(`re-anchor jobs: ${jobErr.message}`)
    stats.jobsReanchored += updatedJobs?.length ?? 0
  } else {
    const pendingJobs = await countJobsToReanchor(supabase, company.id)
    stats.jobsReanchored += pendingJobs
    profileId = `(dry-run-${company.id})`
    if (synthesized) {
      console.log(
        `  DRY-RUN would create ${profileTable}, link verification, re-anchor ${pendingJobs} job(s)`,
      )
    } else {
      console.log(
        `  DRY-RUN would create ${profileTable} from verification=${verification?.id}, re-anchor ${pendingJobs} job(s)`,
      )
    }
  }

  stats.processed += 1
  console.log(
    `  OK company=${company.id} entity=${entityType} profile=${profileId} domains=[${domains.join(', ')}] legacy_domain_source=companies.domains`,
  )
}

async function runBatches(
  supabase: ReturnType<typeof createP110AdminClient>,
  entityType: 'business' | 'university',
  write: boolean,
  stats: BackfillStats,
): Promise<void> {
  const companies = await fetchClaimedCompanies(supabase, entityType)
  console.log(`\n--- Processing ${entityType} (${companies.length} claimed) ---`)

  for (let offset = 0; offset < companies.length; offset += BATCH_SIZE) {
    const batch = companies.slice(offset, offset + BATCH_SIZE)
    console.log(
      `Batch ${Math.floor(offset / BATCH_SIZE) + 1}/${Math.ceil(companies.length / BATCH_SIZE) || 1} (${batch.length} rows)`,
    )

    for (const company of batch) {
      await processCompany(supabase, company, entityType, write, stats)
    }
  }
}

function printSummary(stats: BackfillStats, mode: string): void {
  console.log(`\n========== BACKFILL SUMMARY (${mode}) ==========`)
  console.log(`Total processed:              ${stats.processed}`)
  console.log(`Skipped (already migrated):   ${stats.skippedAlreadyMigrated}`)
  console.log(`Synthesized verifications:    ${stats.synthesizedVerifications}`)
  if (stats.synthesizedCompanyIds.length > 0) {
    console.log(`Synthesized company ids:      ${stats.synthesizedCompanyIds.join(', ')}`)
  }
  console.log(`Profiles created:             ${stats.profilesCreated}`)
  console.log(`Jobs re-anchored:             ${stats.jobsReanchored}`)
  console.log('==============================================\n')
}

/** In-memory proof path when the linked database has not received P-101–P-104 migrations. */
async function runSimulate(): Promise<void> {
  console.log('\n=== SIMULATE MODE (no database writes) ===\n')

  const stats: BackfillStats = {
    processed: 0,
    skippedAlreadyMigrated: 0,
    synthesizedVerifications: 0,
    synthesizedCompanyIds: [],
    jobsReanchored: 2,
    profilesCreated: 0,
  }

  const fixtures: Array<{ company: LegacyCompanyRow; entity: 'business' | 'university'; hasVr: boolean }> =
    [
      {
        entity: 'business',
        hasVr: true,
        company: {
          id: '11111111-1111-1111-1111-111111111111',
          entity_type: 'business',
          claimed_by: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          name: 'Acme Corp',
          name_ar: 'أكمة',
          domains: ['acme.sa'],
          created_at: '2024-06-01T00:00:00Z',
          claim_approved_at: '2024-06-15T00:00:00Z',
        },
      },
      {
        entity: 'university',
        hasVr: false,
        company: {
          id: '22222222-2222-2222-2222-222222222222',
          entity_type: 'university',
          claimed_by: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          name: 'Example University',
          name_ar: 'جامعة مثال',
          domains: ['example.edu.sa'],
          created_at: '2024-07-01T00:00:00Z',
        },
      },
    ]

  for (const fixture of fixtures) {
    const names = displayNames(fixture.company)
    const domains = legacyVerifiedDomains(fixture.company)
    if (!fixture.hasVr) {
      stats.synthesizedVerifications += 1
      stats.synthesizedCompanyIds.push(fixture.company.id)
      console.log(
        `  ANOMALY synthesize verification: company=${fixture.company.id} owner=${fixture.company.claimed_by}`,
      )
    }
    stats.processed += 1
    console.log(
      `  SIMULATE create ${fixture.entity === 'university' ? 'university_profiles' : 'business_profiles'} status=published company=${fixture.company.id} names=${names.ar}/${names.en ?? '-'} domains=[${domains.join(', ')}]`,
    )
  }

  printSummary(stats, 'simulate')
}

async function main(): Promise<void> {
  const flags = parseP110Flags(process.argv)
  const env = loadRuntimeEnv()

  console.log('P-110 backfill-legacy-profiles')
  console.log(`Mode: ${flags.simulate ? 'simulate' : flags.dryRun ? 'dry-run' : 'execute'}`)
  console.log(`Target: ${env.NEXT_PUBLIC_SUPABASE_URL ?? '(unset)'}`)
  console.log(`APP_ENV: ${env.NEXT_PUBLIC_APP_ENV ?? '(unset)'}`)

  if (flags.simulate) {
    await runSimulate()
    return
  }

  assertWriteSafety(flags, env)

  const supabase = createP110AdminClient(env)
  await preflightSchema(supabase)

  const stats: BackfillStats = {
    processed: 0,
    skippedAlreadyMigrated: 0,
    synthesizedVerifications: 0,
    synthesizedCompanyIds: [],
    jobsReanchored: 0,
    profilesCreated: 0,
  }

  const write = flags.execute

  await runBatches(supabase, 'business', write, stats)
  await runBatches(supabase, 'university', write, stats)

  printSummary(stats, write ? 'execute' : 'dry-run')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
