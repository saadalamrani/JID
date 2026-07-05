/**
 * Catalog claim flow verification (Section 5.5 / Day 7).
 * Run: pnpm tsx scripts/test-catalog-claim.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { emailDomainMatchesAllowed } from '../src/lib/entity/domains'

function loadEnvFile(filename: string): Record<string, string> {
  const filePath = join(process.cwd(), filename)
  if (!existsSync(filePath)) return {}

  const vars: Record<string, string> = {}
  for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
  return vars
}

const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !serviceKey || !anonKey) {
  console.error('Missing Supabase env vars in .env.local')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_PASSWORD = 'TestClaim!234'
const SEED_DOMAIN = 'unclaimed-test.jid.local'

async function checkClaimableProfile(userEmail: string) {
  const email = userEmail.trim().toLowerCase()

  const { data, error } = await admin
    .from('companies')
    .select('id, name, name_ar, slug, domains, entity_state')
    .eq('entity_state', 'unclaimed')
    .eq('entity_type', 'company')
    .eq('is_active', true)

  if (error) throw new Error(error.message)

  const match = (data ?? []).find((company) =>
    emailDomainMatchesAllowed(email, company.domains ?? []),
  )

  if (!match || match.entity_state !== 'unclaimed') return null
  return match
}

async function submitClaim(
  userClient: ReturnType<typeof createClient>,
  input: {
    companyId: string
    userId: string
    userEmail: string
    claimantName: string
  },
) {
  const businessEmail = input.userEmail.trim().toLowerCase()

  const { data: company, error: companyError } = await userClient
    .from('companies')
    .select('id, name, domains, entity_state')
    .eq('id', input.companyId)
    .eq('entity_type', 'company')
    .maybeSingle()

  if (companyError) throw new Error(companyError.message)
  if (!company) throw new Error('Company not found')
  if (company.entity_state !== 'unclaimed') {
    throw new Error('This company has already been claimed or is under review')
  }
  if (!emailDomainMatchesAllowed(businessEmail, (company.domains ?? []) as string[])) {
    throw new Error('Email domain does not match company domains')
  }

  const { data: claim, error: claimError } = await userClient
    .from('claim_requests')
    .insert({
      user_id: input.userId,
      company_id: company.id,
      company_name: company.name,
      business_email: businessEmail,
      claimant_name: input.claimantName.trim(),
      evidence_urls: [],
      status: 'pending_review',
      claim_type: 'company',
      domain_verified: true,
    })
    .select('id, status')
    .single()

  if (claimError || !claim) {
    throw new Error(claimError?.message ?? 'Failed to submit claim')
  }

  const nowIso = new Date().toISOString()
  const { error: companyUpdateError } = await admin
    .from('companies')
    .update({
      entity_state: 'pending_review',
      claimed_by: input.userId,
      claim_requested_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', company.id)
    .eq('entity_state', 'unclaimed')

  if (companyUpdateError) {
    await admin.from('claim_requests').delete().eq('id', claim.id)
    throw new Error(companyUpdateError.message)
  }

  return claim
}

async function main() {
  console.log('--- Catalog claim test ---')

  const { data: company, error } = await admin
    .from('companies')
    .select('id, name, slug, domains, entity_state, claimed_by')
    .eq('entity_state', 'unclaimed')
    .contains('domains', [SEED_DOMAIN])
    .limit(1)
    .maybeSingle()

  if (error || !company) {
    console.error('No seeded unclaimed company with domain', SEED_DOMAIN, error?.message)
    process.exit(1)
  }

  const testEmail = `claim.test@${SEED_DOMAIN}`
  console.log(`Target: ${company.name} (${company.id})`)
  console.log(`Email: ${testEmail}`)

  await admin.from('claim_requests').delete().eq('company_id', company.id)
  await admin
    .from('companies')
    .update({ entity_state: 'unclaimed', claimed_by: null, claim_requested_at: null })
    .eq('id', company.id)

  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 200 })
  const existing = listData.users.find((u) => u.email?.toLowerCase() === testEmail)
  let userId: string

  if (existing?.id) {
    userId = existing.id
  } else {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: testEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Catalog Claim Tester' },
    })
    if (createError || !created.user) throw new Error(createError?.message ?? 'createUser failed')
    userId = created.user.id
    await admin.from('profiles').upsert({
      id: userId,
      full_name: 'Catalog Claim Tester',
      role: 'individual',
    })
  }

  const userClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: signInError } = await userClient.auth.signInWithPassword({
    email: testEmail,
    password: TEST_PASSWORD,
  })
  if (signInError) throw new Error(signInError.message)

  const claimable = await checkClaimableProfile(testEmail)
  console.log('\n1. checkClaimableProfile:', claimable ? `PASS — ${claimable.name}` : 'FAIL')
  if (!claimable || claimable.id !== company.id) process.exit(1)

  const { count: beforeCount } = await admin
    .from('claim_requests')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', company.id)

  const result = await submitClaim(userClient, {
    companyId: company.id,
    userId,
    userEmail: testEmail,
    claimantName: 'Catalog Claim Tester',
  })
  console.log('2. submitCatalogClaim:', result)

  const { data: claims, count: afterCount } = await admin
    .from('claim_requests')
    .select('*', { count: 'exact' })
    .eq('company_id', company.id)

  const { data: updated } = await admin
    .from('companies')
    .select('entity_state, claimed_by, claim_requested_at')
    .eq('id', company.id)
    .single()

  const newRows = (afterCount ?? 0) - (beforeCount ?? 0)

  console.log('\n3. claim_requests:', afterCount, `rows (+${newRows})`)
  console.log('   status:', claims?.[0]?.status, '| type:', claims?.[0]?.claim_type)
  console.log('   domain_verified:', claims?.[0]?.domain_verified)
  console.log('\n4. companies.entity_state:', updated?.entity_state)
  console.log('   claimed_by:', updated?.claimed_by)
  console.log('   claim_requested_at:', updated?.claim_requested_at)

  const pass =
    newRows === 1 &&
    claims?.length === 1 &&
    claims[0]?.claim_type === 'company' &&
    claims[0]?.status === 'pending_review' &&
    claims[0]?.domain_verified === true &&
    updated?.entity_state === 'pending_review' &&
    updated?.claimed_by === userId

  console.log(pass ? '\n✓ ALL ASSERTIONS PASSED' : '\n✗ ASSERTIONS FAILED')
  process.exit(pass ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
