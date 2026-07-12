// @vitest-environment node
/**
 * Jobs re-anchoring RLS proofs (P-104)
 * Migrations: 114–116_jobs_business_profile_anchor through applications_rls_reanchor
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createBusinessProfileFixture,
  createDirectoryCompany,
  createDirectoryWithOwner,
  createRlsUserWithRole,
  deleteApplicationFixture,
  deleteBusinessProfile,
  deleteDirectoryCompany,
  deleteJobFixture,
  deleteRlsUser,
  seedApplicationFixture,
  seedJobFixture,
  type BusinessProfileFixture,
  type DirectoryFixture,
  type JobFixture,
  type RlsRoleUser,
} from './fixtures/jobs-reanchor'
import {
  createAuthenticatedClient,
  createServiceRoleClient,
  getRlsTestEnv,
} from './helpers/supabase-clients'

const env = getRlsTestEnv()
const describeRls = env ? describe : describe.skip

const JOB_DEADLINE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

describeRls('Jobs re-anchoring RLS — zero-leak proofs (P-104)', () => {
  const admin = env ? createServiceRoleClient(env) : null

  let ownerA: RlsRoleUser
  let ownerB: RlsRoleUser
  let legacyOwner: RlsRoleUser
  let applicant: RlsRoleUser

  let directoryA: DirectoryFixture
  let directoryB: DirectoryFixture
  let legacyDirectory: DirectoryFixture

  let profileA: BusinessProfileFixture
  let profileB: BusinessProfileFixture

  let jobA: JobFixture
  let jobB: JobFixture
  let legacyJob: JobFixture
  let transitionalNullJob: JobFixture

  let applicationOnLegacy: string

  beforeAll(async () => {
    if (!admin || !env) return

    ownerA = await createRlsUserWithRole(admin, 'jobs-owner-a', 'company_admin')
    ownerB = await createRlsUserWithRole(admin, 'jobs-owner-b', 'company_admin')
    legacyOwner = await createRlsUserWithRole(admin, 'jobs-legacy', 'company_admin')
    applicant = await createRlsUserWithRole(admin, 'jobs-applicant', 'individual')

    directoryA = await createDirectoryCompany(admin, 'jobs-a')
    directoryB = await createDirectoryCompany(admin, 'jobs-b')
    legacyDirectory = await createDirectoryWithOwner(admin, legacyOwner.id, 'legacy')

    profileA = await createBusinessProfileFixture(admin, ownerA.id, directoryA.id, 'jobs-a')
    profileB = await createBusinessProfileFixture(admin, ownerB.id, directoryB.id, 'jobs-b')

    jobA = await seedJobFixture(admin, {
      companyId: directoryA.id,
      businessProfileId: profileA.id,
      title: 'وظيفة أ',
    })
    jobB = await seedJobFixture(admin, {
      companyId: directoryB.id,
      businessProfileId: profileB.id,
      title: 'وظيفة ب',
    })
    legacyJob = await seedJobFixture(admin, {
      companyId: legacyDirectory.id,
      businessProfileId: null,
      title: 'وظيفة قديمة',
    })
    transitionalNullJob = await seedJobFixture(admin, {
      companyId: directoryA.id,
      businessProfileId: null,
      title: 'وظيفة انتقالية',
    })

    applicationOnLegacy = await seedApplicationFixture(admin, {
      jobId: legacyJob.id,
      companyId: legacyDirectory.id,
      applicantUserId: applicant.id,
    })
  })

  afterAll(async () => {
    if (!admin) return

    await deleteApplicationFixture(admin, applicationOnLegacy)
    await deleteJobFixture(admin, transitionalNullJob.id)
    await deleteJobFixture(admin, legacyJob.id)
    await deleteJobFixture(admin, jobB.id)
    await deleteJobFixture(admin, jobA.id)
    await deleteBusinessProfile(admin, profileB.id)
    await deleteBusinessProfile(admin, profileA.id)
    await deleteDirectoryCompany(admin, legacyDirectory.id)
    await deleteDirectoryCompany(admin, directoryB.id)
    await deleteDirectoryCompany(admin, directoryA.id)
    await deleteRlsUser(admin, applicant.id)
    await deleteRlsUser(admin, legacyOwner.id)
    await deleteRlsUser(admin, ownerB.id)
    await deleteRlsUser(admin, ownerA.id)
  })

  it('1 — owner can INSERT only with own business_profile_id', async () => {
    if (!admin || !env) return
    const client = await createAuthenticatedClient(env, ownerA.email, ownerA.password)

    const { error: badInsert } = await client.from('jobs').insert({
      company_id: directoryA.id,
      business_profile_id: profileB.id,
      title_ar: 'اختراق',
      experience_level: 'entry',
      status: 'draft',
      application_deadline: JOB_DEADLINE,
    })
    expect(badInsert).not.toBeNull()

    const { data: goodRow, error: goodInsert } = await client
      .from('jobs')
      .insert({
        company_id: directoryA.id,
        business_profile_id: profileA.id,
        title_ar: 'وظيفة جديدة',
        experience_level: 'entry',
        status: 'draft',
        application_deadline: JOB_DEADLINE,
      })
      .select('id')
      .single()

    expect(goodInsert).toBeNull()
    expect(goodRow?.id).toBeTruthy()
    if (goodRow?.id) await deleteJobFixture(admin, goodRow.id)
  })

  it('2 — owner A cannot SELECT or UPDATE owner B jobs (profile + transitional NULL)', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, ownerA.email, ownerA.password)

    for (const targetId of [jobB.id, transitionalNullJob.id]) {
      const { data: peek } = await client.from('jobs').select('id').eq('id', targetId).maybeSingle()
      expect(peek).toBeNull()

      const { error: updateError } = await client
        .from('jobs')
        .update({ title_ar: 'tampered' })
        .eq('id', targetId)
      expect(updateError).not.toBeNull()
    }
  })

  it('3 — INSERT without business_profile_id is rejected', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, ownerA.email, ownerA.password)

    const { error } = await client.from('jobs').insert({
      company_id: directoryA.id,
      title_ar: 'بدون ملف',
      experience_level: 'entry',
      status: 'draft',
      application_deadline: JOB_DEADLINE,
    })

    expect(error).not.toBeNull()
  })

  it('4 — transitional claimed_by grants legacy read/update without leaking to other orgs', async () => {
    if (!env) return
    const legacyClient = await createAuthenticatedClient(env, legacyOwner.email, legacyOwner.password)
    const otherClient = await createAuthenticatedClient(env, ownerA.email, ownerA.password)

    const { data: legacyPeek, error: legacyReadError } = await legacyClient
      .from('jobs')
      .select('id, business_profile_id')
      .eq('id', legacyJob.id)
      .maybeSingle()

    expect(legacyReadError).toBeNull()
    expect(legacyPeek?.id).toBe(legacyJob.id)
    expect(legacyPeek?.business_profile_id).toBeNull()

    const { error: legacyUpdateError } = await legacyClient
      .from('jobs')
      .update({ title_ar: 'تحديث قديم' })
      .eq('id', legacyJob.id)
    expect(legacyUpdateError).toBeNull()

    const { data: leakPeek } = await otherClient
      .from('jobs')
      .select('id')
      .eq('id', legacyJob.id)
      .maybeSingle()
    expect(leakPeek).toBeNull()
  })

  it('5 — applications policies mirror job isolation (new + transitional paths)', async () => {
    if (!env) return
    const legacyClient = await createAuthenticatedClient(env, legacyOwner.email, legacyOwner.password)
    const ownerAClient = await createAuthenticatedClient(env, ownerA.email, ownerA.password)

    const { data: legacyApp, error: legacyAppError } = await legacyClient
      .from('applications')
      .select('id')
      .eq('id', applicationOnLegacy)
      .maybeSingle()
    expect(legacyAppError).toBeNull()
    expect(legacyApp?.id).toBe(applicationOnLegacy)

    const { data: deniedForA } = await ownerAClient
      .from('applications')
      .select('id')
      .eq('id', applicationOnLegacy)
      .maybeSingle()
    expect(deniedForA).toBeNull()

    const appOnA = await seedApplicationFixture(admin!, {
      jobId: jobA.id,
      companyId: directoryA.id,
      applicantUserId: applicant.id,
    })

    const { data: ownerAApp } = await ownerAClient
      .from('applications')
      .select('id')
      .eq('id', appOnA)
      .maybeSingle()
    expect(ownerAApp?.id).toBe(appOnA)

    const { data: ownerBDenied } = await createAuthenticatedClient(env, ownerB.email, ownerB.password)
      .then((c) => c.from('applications').select('id').eq('id', appOnA).maybeSingle())
    expect(ownerBDenied).toBeNull()

    await deleteApplicationFixture(admin!, appOnA)
  })
})
