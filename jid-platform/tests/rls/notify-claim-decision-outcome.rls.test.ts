// @vitest-environment node
/**
 * Spec 06-D — disposable notify_claim_decision outcome URL + ownership matrix.
 * Skipped when no local disposable Supabase env is configured.
 */
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createDirectoryCompany,
  createRlsUserWithRole,
  deleteDirectoryCompany,
  deleteRlsUser,
  type DirectoryCompanyFixture,
  type RlsRoleUser,
} from './fixtures/ownership-law'
import {
  createAnonClient,
  createAuthenticatedClient,
  createServiceRoleClient,
  getRlsTestEnv,
} from './helpers/supabase-clients'

const env = getRlsTestEnv()
const describeRls = env ? describe : describe.skip

describeRls('notify_claim_decision outcome URLs (Spec 06-D disposable)', () => {
  const admin = env ? createServiceRoleClient(env) : null

  let staff: RlsRoleUser
  let applicantBusiness: RlsRoleUser
  let applicantUniversity: RlsRoleUser
  let otherApplicant: RlsRoleUser
  let businessDir: DirectoryCompanyFixture
  let universityDir: DirectoryCompanyFixture
  let businessApproveId: string
  let businessRejectId: string
  let universityApproveId: string
  let universityRejectId: string
  let idempotencyId: string

  async function insertVerification(input: {
    applicantId: string
    directoryId: string
    verificationType: 'business' | 'university'
    status?: string
  }): Promise<string> {
    const id = randomUUID()
    const { error } = await admin!.from('verification_requests').insert({
      id,
      applicant_user_id: input.applicantId,
      directory_id: input.directoryId,
      verification_type: input.verificationType,
      company_name: `Fixture ${input.verificationType}`,
      status: input.status ?? 'approved',
      business_email: `${input.verificationType}@jid.local.test`,
      representative_name: 'Synthetic Applicant',
      representative_title: 'Representative',
      evidence_urls: [],
    })
    if (error) throw new Error(error.message)
    return id
  }

  beforeAll(async () => {
    if (!admin) return
    staff = await createRlsUserWithRole(admin, '06d-staff', 'staff')
    applicantBusiness = await createRlsUserWithRole(admin, '06d-biz', 'individual')
    applicantUniversity = await createRlsUserWithRole(admin, '06d-uni', 'individual')
    otherApplicant = await createRlsUserWithRole(admin, '06d-other', 'individual')
    businessDir = await createDirectoryCompany(admin, '06d-biz-dir', 'business')
    universityDir = await createDirectoryCompany(admin, '06d-uni-dir', 'university')

    businessApproveId = await insertVerification({
      applicantId: applicantBusiness.id,
      directoryId: businessDir.id,
      verificationType: 'business',
      status: 'approved',
    })
    businessRejectId = await insertVerification({
      applicantId: applicantBusiness.id,
      directoryId: businessDir.id,
      verificationType: 'business',
      status: 'rejected',
    })
    universityApproveId = await insertVerification({
      applicantId: applicantUniversity.id,
      directoryId: universityDir.id,
      verificationType: 'university',
      status: 'approved',
    })
    universityRejectId = await insertVerification({
      applicantId: applicantUniversity.id,
      directoryId: universityDir.id,
      verificationType: 'university',
      status: 'rejected',
    })
    idempotencyId = await insertVerification({
      applicantId: applicantBusiness.id,
      directoryId: businessDir.id,
      verificationType: 'business',
      status: 'approved',
    })
  }, 120_000)

  afterAll(async () => {
    if (!admin) return
    const ids = [
      businessApproveId,
      businessRejectId,
      universityApproveId,
      universityRejectId,
      idempotencyId,
    ].filter(Boolean)
    if (ids.length > 0) {
      await admin.from('notifications').delete().in('related_resource_id', ids)
      await admin.from('verification_requests').delete().in('id', ids)
    }
    if (businessDir?.id) await deleteDirectoryCompany(admin, businessDir.id)
    if (universityDir?.id) await deleteDirectoryCompany(admin, universityDir.id)
    for (const user of [staff, applicantBusiness, applicantUniversity, otherApplicant]) {
      if (user?.id) await deleteRlsUser(admin, user.id)
    }
  }, 120_000)

  async function staffNotify(claimId: string, decision: string, reason?: string) {
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    return client.rpc('notify_verification_decision', {
      p_verification_id: claimId,
      p_decision: decision,
      p_reason: reason ?? null,
    })
  }

  it('Business approval dispatches to applicant with create-profile URL', async () => {
    const beforeProfiles = await admin!
      .from('business_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', applicantBusiness.id)

    const { error } = await staffNotify(businessApproveId, 'approved')
    expect(error).toBeNull()

    const { data } = await admin!
      .from('notifications')
      .select('recipient_id, category, action_url, body_en, idempotency_key')
      .eq('idempotency_key', `verification.decision:${businessApproveId}:approved`)
      .single()
    expect(data?.recipient_id).toBe(applicantBusiness.id)
    expect(data?.category).toBe('verification.approved')
    expect(data?.action_url).toBe('/company/create-profile')
    expect(data?.body_en).toMatch(/create your owned profile/i)
    expect(data?.body_en?.toLowerCase()).not.toMatch(/automatically created/)

    const afterProfiles = await admin!
      .from('business_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', applicantBusiness.id)
    expect(afterProfiles.count ?? 0).toBe(beforeProfiles.count ?? 0)

    const { data: vr } = await admin!
      .from('verification_requests')
      .select('status')
      .eq('id', businessApproveId)
      .single()
    expect(vr?.status).toBe('approved')
  })

  it('Business rejection includes reason and rejected outcome URL', async () => {
    const { error } = await staffNotify(businessRejectId, 'rejected', 'Incomplete evidence')
    expect(error).toBeNull()
    const { data } = await admin!
      .from('notifications')
      .select('recipient_id, category, action_url, body_en')
      .eq('idempotency_key', `verification.decision:${businessRejectId}:rejected`)
      .single()
    expect(data?.recipient_id).toBe(applicantBusiness.id)
    expect(data?.category).toBe('verification.rejected')
    expect(data?.action_url).toBe('/company/verification-rejected')
    expect(data?.body_en).toMatch(/Reason: Incomplete evidence/)
  })

  it('University approval/rejection use Spec 03 university outcome URLs', async () => {
    const approve = await staffNotify(universityApproveId, 'approved')
    expect(approve.error).toBeNull()
    const { data: a } = await admin!
      .from('notifications')
      .select('recipient_id, action_url, category')
      .eq('idempotency_key', `verification.decision:${universityApproveId}:approved`)
      .single()
    expect(a?.recipient_id).toBe(applicantUniversity.id)
    expect(a?.action_url).toBe('/university/create-profile')
    expect(a?.category).toBe('verification.approved')

    const reject = await staffNotify(universityRejectId, 'rejected', 'Domain mismatch')
    expect(reject.error).toBeNull()
    const { data: r } = await admin!
      .from('notifications')
      .select('recipient_id, action_url, body_en')
      .eq('idempotency_key', `verification.decision:${universityRejectId}:rejected`)
      .single()
    expect(r?.recipient_id).toBe(applicantUniversity.id)
    expect(r?.action_url).toBe('/university/rejected')
    expect(r?.body_en).toMatch(/Reason: Domain mismatch/)
  })

  it('idempotency key yields exactly one in-app row; retry does not duplicate', async () => {
    const first = await staffNotify(idempotencyId, 'approved')
    expect(first.error).toBeNull()
    const second = await staffNotify(idempotencyId, 'approved')
    // dispatcher may return existing id or null error on conflict — count must stay 1
    void second
    const { data } = await admin!
      .from('notifications')
      .select('id')
      .eq('idempotency_key', `verification.decision:${idempotencyId}:approved`)
    expect((data ?? []).length).toBe(1)
  })

  it('another applicant cannot read the notification; anonymous denied', async () => {
    const key = `verification.decision:${businessApproveId}:approved`
    const other = await createAuthenticatedClient(
      env!,
      otherApplicant.email,
      otherApplicant.password,
    )
    const { data: otherRows } = await other
      .from('notifications')
      .select('id, title_en, body_en')
      .eq('idempotency_key', key)
    expect(otherRows ?? []).toEqual([])

    const anon = createAnonClient(env!)
    const { data: anonRows, error: anonError } = await anon
      .from('notifications')
      .select('id')
      .eq('idempotency_key', key)
    if (anonError) {
      expect(anonError).toBeTruthy()
    } else {
      expect(anonRows ?? []).toEqual([])
    }
  })
})
