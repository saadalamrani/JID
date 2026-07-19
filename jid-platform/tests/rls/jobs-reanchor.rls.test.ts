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
  let legacyProfile: BusinessProfileFixture

  let jobA: JobFixture
  let jobB: JobFixture
  let legacyJob: JobFixture

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
    legacyProfile = await createBusinessProfileFixture(
      admin,
      ownerB.id,
      legacyDirectory.id,
      'jobs-legacy-anchor',
    )

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
      businessProfileId: legacyProfile.id,
      title: 'وظيفة مرتبطة بملف',
    })
  })

  afterAll(async () => {
    if (!admin) return

    if (legacyJob?.id) await deleteJobFixture(admin, legacyJob.id)
    if (jobB?.id) await deleteJobFixture(admin, jobB.id)
    if (jobA?.id) await deleteJobFixture(admin, jobA.id)
    if (legacyProfile?.id) await deleteBusinessProfile(admin, legacyProfile.id)
    if (profileB?.id) await deleteBusinessProfile(admin, profileB.id)
    if (profileA?.id) await deleteBusinessProfile(admin, profileA.id)
    if (legacyDirectory?.id) await deleteDirectoryCompany(admin, legacyDirectory.id)
    if (directoryB?.id) await deleteDirectoryCompany(admin, directoryB.id)
    if (directoryA?.id) await deleteDirectoryCompany(admin, directoryA.id)
    if (applicant?.id) await deleteRlsUser(admin, applicant.id)
    if (legacyOwner?.id) await deleteRlsUser(admin, legacyOwner.id)
    if (ownerB?.id) await deleteRlsUser(admin, ownerB.id)
    if (ownerA?.id) await deleteRlsUser(admin, ownerA.id)
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

  it('2 — owner A cannot SELECT or UPDATE owner B jobs', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, ownerA.email, ownerA.password)

    const { data: peek } = await client.from('jobs').select('id').eq('id', jobB.id).maybeSingle()
    expect(peek).toBeNull()

    const { data: updated, error: updateError } = await client
      .from('jobs')
      .update({ title_ar: 'tampered' })
      .eq('id', jobB.id)
      .select('id')
    expect(updateError).toBeNull()
    expect(updated).toEqual([])
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

  it('4 — Directory claimed_by alone grants no job read or update access', async () => {
    if (!env) return
    const legacyClient = await createAuthenticatedClient(env, legacyOwner.email, legacyOwner.password)
    const profileOwnerClient = await createAuthenticatedClient(env, ownerB.email, ownerB.password)

    const { data: legacyPeek, error: legacyReadError } = await legacyClient
      .from('jobs')
      .select('id, business_profile_id')
      .eq('id', legacyJob.id)
      .maybeSingle()

    expect(legacyReadError).toBeNull()
    expect(legacyPeek).toBeNull()

    const { data: legacyUpdated, error: legacyUpdateError } = await legacyClient
      .from('jobs')
      .update({ title_ar: 'تحديث قديم' })
      .eq('id', legacyJob.id)
      .select('id')
    expect(legacyUpdateError).toBeNull()
    expect(legacyUpdated).toEqual([])

    const { data: ownerPeek } = await profileOwnerClient
      .from('jobs')
      .select('id')
      .eq('id', legacyJob.id)
      .maybeSingle()
    expect(ownerPeek?.id).toBe(legacyJob.id)
  })

  it('5 — applications policies mirror owned-profile job isolation', async () => {
    if (!env) return
    const ownerAClient = await createAuthenticatedClient(env, ownerA.email, ownerA.password)

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
