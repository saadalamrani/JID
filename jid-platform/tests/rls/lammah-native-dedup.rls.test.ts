// @vitest-environment node
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createAnonClient,
  createAuthenticatedClient,
  createServiceRoleClient,
  getRlsTestEnv,
} from './helpers/supabase-clients'

const env = getRlsTestEnv()
const describeRls = env ? describe : describe.skip
const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
const publishedAt = new Date().toISOString()

type CompanyFixture = {
  companyId: string
  profileId: string
  sourceId: string
}

type IngestInput = {
  company: CompanyFixture
  title: string
  externalUrl?: string
  externalRefHash?: string
  opportunityType?: 'job' | 'co_op' | 'internship' | 'fellowship' | 'scholarship'
  experienceLevel?: 'intern' | 'entry' | 'mid' | 'senior' | 'executive'
}

function assertClient(client: SupabaseClient | null): asserts client is SupabaseClient {
  expect(client).not.toBeNull()
}

describeRls('Lammah/native dedup boundary — database and RLS proofs', () => {
  const admin = env ? createServiceRoleClient(env) : null
  const anon = env ? createAnonClient(env) : null
  const suffix = randomUUID().slice(0, 8)
  const authEmail = `lammah-dedup-${suffix}@example.test`
  const authPassword = `Lammah-${randomUUID()}`

  let authenticated: SupabaseClient | null = null
  let authUserId = ''
  let companyA: CompanyFixture
  let companyB: CompanyFixture
  let sectorId = ''
  let regionId = ''
  let planId = ''
  let activeLammahId = ''
  let supersededLammahId = ''
  let applicationCountBefore = 0
  let communicationCountBefore = 0
  let communicationLogCountBefore = 0

  const jobIds: string[] = []

  async function createCompany(label: string): Promise<CompanyFixture> {
    assertClient(admin)

    const { data: company, error: companyError } = await admin
      .from('companies')
      .insert({
        name: `Lammah ${label} ${suffix}`,
        name_ar: `لمّاح ${label} ${suffix}`,
        slug: `lammah-${label.toLowerCase()}-${suffix}`,
        entity_type: 'business',
        sector_id: sectorId,
        region_id: regionId,
      })
      .select('id')
      .single()
    expect(companyError).toBeNull()
    expect(company?.id).toBeTruthy()

    const { data: profile, error: profileError } = await admin
      .from('business_profiles')
      .insert({
        directory_id: company!.id,
        owner_user_id: authUserId,
        display_name_ar: `لمّاح ${label} ${suffix}`,
        display_name_en: `Lammah ${label} ${suffix}`,
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    expect(profileError).toBeNull()
    expect(profile?.id).toBeTruthy()

    const { data: source, error: sourceError } = await admin
      .from('lammah_sources')
      .insert({
        name: `Lammah source ${label} ${suffix}`,
        company_id: company!.id,
        base_url: `https://${label.toLowerCase()}-${suffix}.example.test/careers`,
        source_type: 'career_page',
        trust_tier: 1,
      })
      .select('id')
      .single()
    expect(sourceError).toBeNull()
    expect(source?.id).toBeTruthy()

    return {
      companyId: company!.id,
      profileId: profile!.id,
      sourceId: source!.id,
    }
  }

  async function createJob(input: {
    company: CompanyFixture
    title: string
    status?: 'draft' | 'published' | 'closing_soon' | 'closed'
    externalUrl?: string
    experienceLevel?: 'intern' | 'entry' | 'mid' | 'senior' | 'executive'
  }): Promise<string> {
    assertClient(admin)

    const { data, error } = await admin
      .from('jobs')
      .insert({
        business_profile_id: input.company.profileId,
        company_id: input.company.companyId,
        title_ar: input.title,
        title_en: input.title,
        status: input.status ?? 'published',
        published_at:
          input.status === 'draft' || input.status === 'closed' ? null : new Date().toISOString(),
        application_deadline: futureDeadline,
        external_apply_url: input.externalUrl ?? null,
        experience_level: input.experienceLevel ?? 'entry',
        region_id: regionId,
        sector_id: sectorId,
      })
      .select('id')
      .single()
    expect(error).toBeNull()
    expect(data?.id).toBeTruthy()
    jobIds.push(data!.id)
    return data!.id
  }

  async function ingest(input: IngestInput): Promise<{
    id: string | null
    error: { message: string } | null
  }> {
    assertClient(admin)

    const externalRefHash = input.externalRefHash ?? `lammah-${randomUUID()}`
    const { data, error } = await admin.rpc('ingest_lammah_opportunity', {
      p: {
        source_id: input.company.sourceId,
        company_id: input.company.companyId,
        company_name_raw: `Lammah ${suffix}`,
        title_ar: input.title,
        title_en: input.title,
        excerpt: input.title,
        sector: `lammah-sector-${suffix}`,
        region: `lammah-region-${suffix}`,
        experience_level: input.experienceLevel ?? 'entry',
        opportunity_type: input.opportunityType ?? 'job',
        external_url:
          input.externalUrl ?? `https://opportunities-${suffix}.example.test/${externalRefHash}`,
        external_ref_hash: externalRefHash,
        source_published_at: publishedAt,
        extraction_confidence: 0.99,
      },
    })

    return { id: data, error }
  }

  async function getLammah(id: string) {
    assertClient(admin)
    const { data, error } = await admin
      .from('lammah_opportunities')
      .select('id, status, superseded_by_job_id, opportunity_type')
      .eq('id', id)
      .single()
    expect(error).toBeNull()
    return data!
  }

  beforeAll(async () => {
    assertClient(admin)
    expect(env).not.toBeNull()

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: authEmail,
      password: authPassword,
      email_confirm: true,
    })
    expect(authError).toBeNull()
    expect(authData.user?.id).toBeTruthy()
    authUserId = authData.user!.id
    authenticated = await createAuthenticatedClient(env!, authEmail, authPassword)

    const { data: sector, error: sectorError } = await admin
      .from('sectors')
      .insert({
        slug: `lammah-sector-${suffix}`,
        name_ar: `قطاع لمّاح ${suffix}`,
        name_en: `Lammah sector ${suffix}`,
      })
      .select('id')
      .single()
    expect(sectorError).toBeNull()
    sectorId = sector!.id

    const { data: region, error: regionError } = await admin
      .from('regions')
      .insert({
        slug: `lammah-region-${suffix}`,
        name_ar: `منطقة لمّاح ${suffix}`,
        name_en: `Lammah region ${suffix}`,
      })
      .select('id')
      .single()
    expect(regionError).toBeNull()
    regionId = region!.id

    companyA = await createCompany('A')
    companyB = await createCompany('B')

    const { data: plan, error: planError } = await admin
      .from('plans')
      .insert({
        key: `lammah-dedup-${suffix}`,
        name_ar: `خطة لمّاح ${suffix}`,
        name_en: `Lammah plan ${suffix}`,
        audience: 'user',
        price_monthly_sar: 0,
        price_yearly_sar: 0,
      })
      .select('id')
      .single()
    expect(planError).toBeNull()
    planId = plan!.id

    const { error: entitlementError } = await admin.from('plan_entitlements').insert({
      plan_id: planId,
      feature_key: 'lammah_feed',
    })
    expect(entitlementError).toBeNull()

    const { error: subscriptionError } = await admin.from('subscriptions').insert({
      plan_id: planId,
      user_id: authUserId,
      subscriber_type: 'user',
      billing_cycle: 'monthly',
      status: 'active',
      current_period_end: futureDeadline,
    })
    expect(subscriptionError).toBeNull()

    const { count: applications, error: applicationCountError } = await admin
      .from('applications')
      .select('*', { count: 'exact', head: true })
    expect(applicationCountError).toBeNull()
    applicationCountBefore = applications ?? 0

    const { count: communications, error: communicationCountError } = await admin
      .from('communication_batches')
      .select('*', { count: 'exact', head: true })
    expect(communicationCountError).toBeNull()
    communicationCountBefore = communications ?? 0

    const { count: communicationLogs, error: communicationLogCountError } = await admin
      .from('communication_log')
      .select('*', { count: 'exact', head: true })
    expect(communicationLogCountError).toBeNull()
    communicationLogCountBefore = communicationLogs ?? 0

    const active = await ingest({
      company: companyA,
      title: `Active radar fixture ${suffix}`,
    })
    expect(active.error).toBeNull()
    expect(active.id).toBeTruthy()
    activeLammahId = active.id!
  })

  afterAll(async () => {
    if (!admin) return

    await admin.from('lammah_radar_items').delete().eq('user_id', authUserId)
    await admin.from('lammah_sources').delete().in('id', [companyA?.sourceId, companyB?.sourceId])
    if (jobIds.length > 0) await admin.from('jobs').delete().in('id', jobIds)
    if (companyA?.profileId || companyB?.profileId) {
      await admin
        .from('business_profiles')
        .delete()
        .in('id', [companyA?.profileId, companyB?.profileId])
    }
    await admin.from('subscriptions').delete().eq('plan_id', planId)
    await admin.from('plan_entitlements').delete().eq('plan_id', planId)
    await admin.from('plans').delete().eq('id', planId)
    if (companyA?.companyId || companyB?.companyId) {
      await admin.from('companies').delete().in('id', [companyA?.companyId, companyB?.companyId])
    }
    await admin.from('regions').delete().eq('id', regionId)
    await admin.from('sectors').delete().eq('id', sectorId)
    if (authUserId) await admin.auth.admin.deleteUser(authUserId)
  })

  it('1 — native published first: ingest retains provenance as superseded and hides it from the feed', async () => {
    const jobId = await createJob({
      company: companyA,
      title: `Published first ${suffix}`,
    })
    const result = await ingest({
      company: companyA,
      title: `Published first ${suffix}`,
    })
    expect(result.error).toBeNull()
    expect(result.id).toBeTruthy()

    const row = await getLammah(result.id!)
    expect(row.status).toBe('superseded')
    expect(row.superseded_by_job_id).toBe(jobId)

    assertClient(authenticated)
    const { data, error } = await authenticated
      .from('lammah_opportunities')
      .select('id')
      .eq('id', result.id!)
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('2 — Lammah first: publishing a native draft supersedes and links the retained row', async () => {
    assertClient(admin)
    const result = await ingest({
      company: companyA,
      title: `Lammah first ${suffix}`,
    })
    expect(result.error).toBeNull()
    const jobId = await createJob({
      company: companyA,
      title: `Lammah first ${suffix}`,
      status: 'draft',
    })

    const { error } = await admin
      .from('jobs')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', jobId)
    expect(error).toBeNull()

    const row = await getLammah(result.id!)
    expect(row.status).toBe('superseded')
    expect(row.superseded_by_job_id).toBe(jobId)
    supersededLammahId = result.id!
  })

  it('3 — a native draft does not suppress an active Lammah opportunity', async () => {
    const title = `Draft does not win ${suffix}`
    const result = await ingest({ company: companyA, title })
    expect(result.error).toBeNull()
    await createJob({ company: companyA, title, status: 'draft' })

    const row = await getLammah(result.id!)
    expect(row.status).toBe('active')
    expect(row.superseded_by_job_id).toBeNull()
  })

  it('4 — the same title at another company is not a duplicate', async () => {
    const title = `Shared title ${suffix}`
    await createJob({ company: companyA, title })
    const result = await ingest({ company: companyB, title })
    expect(result.error).toBeNull()

    const row = await getLammah(result.id!)
    expect(row.status).toBe('active')
  })

  it('5 — unrelated titles at the same company remain separate opportunities', async () => {
    await createJob({ company: companyA, title: `Chief financial officer ${suffix}` })
    const result = await ingest({
      company: companyA,
      title: `Laboratory safety technician ${suffix}`,
    })
    expect(result.error).toBeNull()

    const row = await getLammah(result.id!)
    expect(row.status).toBe('active')
  })

  it('6 — an exact safe normalized opportunity URL supersedes across company identity', async () => {
    const sharedPath = `https://www.shared-${suffix}.example.test/opportunities/123/`
    const jobId = await createJob({
      company: companyA,
      title: `Native URL title ${suffix}`,
      externalUrl: sharedPath,
    })
    const result = await ingest({
      company: companyB,
      title: `Different external title ${suffix}`,
      externalUrl: `http://shared-${suffix}.example.test/opportunities/123`,
    })
    expect(result.error).toBeNull()

    const row = await getLammah(result.id!)
    expect(row.status).toBe('superseded')
    expect(row.superseded_by_job_id).toBe(jobId)
  })

  it('7 — high title similarity needs the same company plus a supporting signal', async () => {
    const jobId = await createJob({
      company: companyA,
      title: `Senior software engineer platform ${suffix}`,
      experienceLevel: 'senior',
    })
    const result = await ingest({
      company: companyA,
      title: `Senior software engineer platforms ${suffix}`,
      experienceLevel: 'senior',
    })
    expect(result.error).toBeNull()

    const row = await getLammah(result.id!)
    expect(row.status).toBe('superseded')
    expect(row.superseded_by_job_id).toBe(jobId)
  })

  it('8 — scholarship and fellowship families never auto-map to native jobs', async () => {
    const sharedUrl = `https://families-${suffix}.example.test/opportunity/42`
    await createJob({
      company: companyA,
      title: `Graduate opportunity ${suffix}`,
      externalUrl: sharedUrl,
    })

    for (const opportunityType of ['scholarship', 'fellowship'] as const) {
      const result = await ingest({
        company: companyA,
        title: `Graduate opportunity ${suffix}`,
        externalUrl: sharedUrl,
        opportunityType,
      })
      expect(result.error).toBeNull()
      const row = await getLammah(result.id!)
      expect(row.status).toBe('active')
      expect(row.opportunity_type).toBe(opportunityType)
    }
  })

  it('9 — concurrent native publish and Lammah ingest cannot leave an active conflict', async () => {
    assertClient(admin)
    const title = `Concurrent boundary ${suffix}`
    const jobId = await createJob({ company: companyA, title, status: 'draft' })
    const externalRefHash = `concurrency-${randomUUID()}`

    const [publishResult, ingestResult] = await Promise.all([
      admin
        .from('jobs')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', jobId),
      ingest({
        company: companyA,
        title,
        externalRefHash,
      }),
    ])

    expect(publishResult.error).toBeNull()
    expect(ingestResult.error).toBeNull()
    expect(ingestResult.id).toBeTruthy()
    const row = await getLammah(ingestResult.id!)
    expect(row.status).toBe('superseded')
    expect(row.superseded_by_job_id).toBe(jobId)
  })

  it('10 — repeated ingestion is idempotent and retains one source row', async () => {
    assertClient(admin)
    const externalRefHash = `idempotent-${randomUUID()}`
    const input = {
      company: companyA,
      title: `Idempotent opportunity ${suffix}`,
      externalRefHash,
    }

    const first = await ingest(input)
    const second = await ingest(input)
    expect(first.error).toBeNull()
    expect(first.id).toBeTruthy()
    expect(second.error).toBeNull()
    expect(second.id).toBeNull()

    const { count, error } = await admin
      .from('lammah_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('external_ref_hash', externalRefHash)
    expect(error).toBeNull()
    expect(count).toBe(1)
  })

  it('11 — closing or unpublishing native content does not resurrect superseded provenance', async () => {
    assertClient(admin)
    expect(supersededLammahId).toBeTruthy()
    const rowBefore = await getLammah(supersededLammahId)
    expect(rowBefore.superseded_by_job_id).toBeTruthy()

    const { error } = await admin
      .from('jobs')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', rowBefore.superseded_by_job_id!)
    expect(error).toBeNull()

    const rowAfter = await getLammah(supersededLammahId)
    expect(rowAfter.status).toBe('superseded')
    expect(rowAfter.superseded_by_job_id).toBe(rowBefore.superseded_by_job_id)
  })

  it('12 — anon cannot execute the ingest RPC', async () => {
    assertClient(anon)
    const { error } = await anon.rpc('ingest_lammah_opportunity', { p: {} })
    expect(error).not.toBeNull()
  })

  it('13 — an ordinary authenticated user cannot execute the ingest RPC', async () => {
    assertClient(authenticated)
    const { error } = await authenticated.rpc('ingest_lammah_opportunity', { p: {} })
    expect(error).not.toBeNull()
  })

  it('14 — service role can use the RPC but cannot bypass the single write path', async () => {
    assertClient(admin)
    const result = await ingest({
      company: companyA,
      title: `Service role RPC ${suffix}`,
    })
    expect(result.error).toBeNull()
    expect(result.id).toBeTruthy()

    const { error: directInsertError } = await admin.from('lammah_opportunities').insert({
      source_id: companyA.sourceId,
      company_id: companyA.companyId,
      company_name_raw: `Direct insert ${suffix}`,
      title_en: `Direct insert ${suffix}`,
      sector: `lammah-sector-${suffix}`,
      region: `lammah-region-${suffix}`,
      opportunity_type: 'job',
      external_url: `https://direct-${suffix}.example.test/opportunity/1`,
      external_ref_hash: `direct-${randomUUID()}`,
      source_published_at: publishedAt,
      expires_at: futureDeadline,
    })
    expect(directInsertError).not.toBeNull()
  })

  it('15 — feed, radar, applications, and communications preserve the isolation boundary', async () => {
    assertClient(admin)
    assertClient(authenticated)

    const { data: feedRows, error: feedError } = await authenticated
      .from('lammah_opportunities')
      .select('id')
      .in('id', [activeLammahId, supersededLammahId])
    expect(feedError).toBeNull()
    expect(feedRows).toEqual([{ id: activeLammahId }])

    const { data: radar, error: radarError } = await authenticated
      .from('lammah_radar_items')
      .insert({
        user_id: authUserId,
        lammah_id: activeLammahId,
      })
      .select('id')
      .single()
    expect(radarError).toBeNull()
    expect(radar?.id).toBeTruthy()

    const { error: applicationBoundaryError } = await admin.from('applications').insert({
      job_id: activeLammahId,
    })
    expect(applicationBoundaryError).not.toBeNull()

    const { count: applicationCount, error: applicationCountError } = await admin
      .from('applications')
      .select('*', { count: 'exact', head: true })
    expect(applicationCountError).toBeNull()
    expect(applicationCount).toBe(applicationCountBefore)

    const { count: communicationCount, error: communicationCountError } = await admin
      .from('communication_batches')
      .select('*', { count: 'exact', head: true })
    expect(communicationCountError).toBeNull()
    expect(communicationCount).toBe(communicationCountBefore)

    const { count: communicationLogCount, error: communicationLogCountError } = await admin
      .from('communication_log')
      .select('*', { count: 'exact', head: true })
    expect(communicationLogCountError).toBeNull()
    expect(communicationLogCount).toBe(communicationLogCountBefore)
  })
})
