// @vitest-environment node
/**
 * JID-102A1 — verification_requests INSERT boundary
 * Migration: 127_verification_requests_insert_boundary.sql
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createDirectoryCompany,
  createRlsUserWithRole,
  deleteDirectoryCompany,
  deleteRlsUser,
  deleteVerificationRequest,
  type DirectoryFixture,
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

describeRls('Verification request INSERT boundary (JID-102A1)', () => {
  const admin = env ? createServiceRoleClient(env) : null

  let applicant: RlsRoleUser
  let otherApplicant: RlsRoleUser
  let staff: RlsRoleUser
  let businessDirectory: DirectoryFixture
  let universityDirectory: DirectoryFixture

  const createdVerificationIds: string[] = []

  beforeAll(async () => {
    if (!admin || !env) return

    applicant = await createRlsUserWithRole(admin, 'vr-applicant', 'individual')
    otherApplicant = await createRlsUserWithRole(admin, 'vr-other', 'individual')
    staff = await createRlsUserWithRole(admin, 'vr-staff', 'staff')

    businessDirectory = await createDirectoryCompany(admin, 'vr-biz', 'business')
    universityDirectory = await createDirectoryCompany(admin, 'vr-uni', 'university')
  })

  afterAll(async () => {
    if (!admin) return

    for (const id of createdVerificationIds) {
      await deleteVerificationRequest(admin, id)
    }
    await deleteDirectoryCompany(admin, businessDirectory.id)
    await deleteDirectoryCompany(admin, universityDirectory.id)
    await deleteRlsUser(admin, staff.id)
    await deleteRlsUser(admin, otherApplicant.id)
    await deleteRlsUser(admin, applicant.id)
  })

  function track(id: string | null | undefined) {
    if (id) createdVerificationIds.push(id)
  }

  it('1 — anonymous INSERT is denied', async () => {
    if (!env) return
    const anon = createAnonClient(env)

    const { data, error } = await anon
      .from('verification_requests')
      .insert({
        applicant_user_id: applicant.id,
        directory_id: businessDirectory.id,
        company_name: 'Anon Forge Co',
        business_email: 'anon@example.test',
        claimant_name: 'Anon',
        status: 'pending_review',
        verification_type: 'business',
        evidence_urls: [],
      })
      .select('id')
      .maybeSingle()

    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })

  it('2 — legitimate own pending_review business request succeeds', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, applicant.email, applicant.password)

    const { data, error } = await client
      .from('verification_requests')
      .insert({
        applicant_user_id: applicant.id,
        directory_id: businessDirectory.id,
        company_name: 'Legitimate Biz',
        business_email: 'legit@example.test',
        claimant_name: 'Applicant',
        claimant_title: 'Owner',
        status: 'pending_review',
        verification_type: 'business',
        evidence_urls: [],
        domain_verified: true,
      })
      .select('id, status')
      .single()

    expect(error).toBeNull()
    expect(data?.status).toBe('pending_review')
    track(data?.id)
  })

  it('3 — forged approved status is denied', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, applicant.email, applicant.password)

    const { data, error } = await client
      .from('verification_requests')
      .insert({
        applicant_user_id: applicant.id,
        directory_id: businessDirectory.id,
        company_name: 'Forged Approved',
        business_email: 'forged-approved@example.test',
        claimant_name: 'Applicant',
        status: 'approved',
        verification_type: 'business',
        evidence_urls: [],
      })
      .select('id')
      .maybeSingle()

    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })

  it('4 — forged rejected / under_review staff-controlled statuses are denied', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, applicant.email, applicant.password)

    for (const status of ['rejected', 'under_review', 'needs_more_info', 'submitted', 'pending'] as const) {
      const { data, error } = await client
        .from('verification_requests')
        .insert({
          applicant_user_id: applicant.id,
          directory_id: businessDirectory.id,
          company_name: `Forged ${status}`,
          business_email: `forged-${status}@example.test`,
          claimant_name: 'Applicant',
          status,
          verification_type: 'business',
          evidence_urls: [],
        })
        .select('id')
        .maybeSingle()

      expect(error, `status=${status}`).not.toBeNull()
      expect(data, `status=${status}`).toBeNull()
    }
  })

  it('5 — reviewer identity fields are denied', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, applicant.email, applicant.password)

    const { data, error } = await client
      .from('verification_requests')
      .insert({
        applicant_user_id: applicant.id,
        directory_id: businessDirectory.id,
        company_name: 'Forged Reviewer',
        business_email: 'forged-reviewer@example.test',
        claimant_name: 'Applicant',
        status: 'pending_review',
        verification_type: 'business',
        evidence_urls: [],
        reviewed_by: staff.id,
        first_viewed_by: staff.id,
        assigned_staff_id: staff.id,
      })
      .select('id')
      .maybeSingle()

    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })

  it('6 — decision / rejection fields are denied', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, applicant.email, applicant.password)

    const { data, error } = await client
      .from('verification_requests')
      .insert({
        applicant_user_id: applicant.id,
        directory_id: businessDirectory.id,
        company_name: 'Forged Decision',
        business_email: 'forged-decision@example.test',
        claimant_name: 'Applicant',
        status: 'pending_review',
        verification_type: 'business',
        evidence_urls: [],
        reviewed_at: new Date().toISOString(),
        review_notes: 'self-approved',
        rejection_reason: 'n/a',
        can_reapply_after: new Date().toISOString(),
        required_documents: ['commercial_registry'],
        sla_due_at: new Date().toISOString(),
        first_viewed_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle()

    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })

  it('7 — resulting_profile fields are denied', async () => {
    if (!admin || !env) return
    const client = await createAuthenticatedClient(env, applicant.email, applicant.password)
    const fakeProfileId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'

    const { data, error } = await client
      .from('verification_requests')
      .insert({
        applicant_user_id: applicant.id,
        directory_id: businessDirectory.id,
        company_name: 'Forged Profile Link',
        business_email: 'forged-profile@example.test',
        claimant_name: 'Applicant',
        status: 'pending_review',
        verification_type: 'business',
        evidence_urls: [],
        resulting_profile_id: fakeProfileId,
        resulting_profile_type: 'business',
        verified_domains: ['stolen.test'],
      })
      .select('id')
      .maybeSingle()

    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })

  it('8 — another applicant_user_id is denied', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, applicant.email, applicant.password)

    const { data, error } = await client
      .from('verification_requests')
      .insert({
        applicant_user_id: otherApplicant.id,
        directory_id: businessDirectory.id,
        company_name: 'Cross User',
        business_email: 'cross-user@example.test',
        claimant_name: 'Applicant',
        status: 'pending_review',
        verification_type: 'business',
        evidence_urls: [],
      })
      .select('id')
      .maybeSingle()

    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })

  it('9 — pending verification cannot create a Business Profile', async () => {
    if (!admin || !env) return
    const client = await createAuthenticatedClient(env, applicant.email, applicant.password)

    const { data: pending, error: insertError } = await client
      .from('verification_requests')
      .insert({
        applicant_user_id: applicant.id,
        directory_id: businessDirectory.id,
        company_name: 'Pending Biz Gate',
        business_email: 'pending-biz@example.test',
        claimant_name: 'Applicant',
        status: 'pending_review',
        verification_type: 'business',
        evidence_urls: [],
      })
      .select('id')
      .single()

    expect(insertError).toBeNull()
    track(pending?.id)

    const { data: profileId, error } = await client.rpc('create_business_profile', {
      p_verification_id: pending!.id,
      p_display_name_ar: 'ملف غير مصرح',
      p_display_name_en: 'Unauthorized',
    })

    expect(error).not.toBeNull()
    expect(profileId).toBeNull()
  })

  it('10 — pending verification cannot create a University Profile', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, applicant.email, applicant.password)

    const { data: pending, error: insertError } = await client
      .from('verification_requests')
      .insert({
        applicant_user_id: applicant.id,
        directory_id: universityDirectory.id,
        company_name: 'Pending Uni Gate',
        business_email: 'pending-uni@example.test',
        claimant_name: 'Applicant',
        status: 'pending_review',
        verification_type: 'university',
        evidence_urls: [],
      })
      .select('id')
      .single()

    expect(insertError).toBeNull()
    track(pending?.id)

    const { data: profileId, error } = await client.rpc('create_university_profile', {
      p_verification_id: pending!.id,
      p_display_name_ar: 'جامعة غير مصرح',
      p_display_name_en: 'Unauthorized Uni',
    })

    expect(error).not.toBeNull()
    expect(profileId).toBeNull()
  })

  it('11 — Staff approval and rejection still work via RPC', async () => {
    if (!admin || !env) return
    const applicantClient = await createAuthenticatedClient(env, applicant.email, applicant.password)
    const staffClient = await createAuthenticatedClient(env, staff.email, staff.password)

    const { data: toApprove, error: approveInsertError } = await applicantClient
      .from('verification_requests')
      .insert({
        applicant_user_id: applicant.id,
        directory_id: businessDirectory.id,
        company_name: 'Staff Approve Target',
        business_email: 'staff-approve@example.test',
        claimant_name: 'Applicant',
        status: 'pending_review',
        verification_type: 'business',
        evidence_urls: [],
      })
      .select('id')
      .single()
    expect(approveInsertError).toBeNull()
    track(toApprove?.id)

    const { error: approveError } = await staffClient.rpc('approve_verification_request', {
      p_verification_id: toApprove!.id,
      p_review_notes: 'JID-102A1 staff approval proof',
      p_verified_domains: ['example.test'],
    })
    expect(approveError).toBeNull()

    const { data: approvedRow } = await admin
      .from('verification_requests')
      .select('status, reviewed_by, resulting_profile_id')
      .eq('id', toApprove!.id)
      .single()
    expect(approvedRow?.status).toBe('approved')
    expect(approvedRow?.reviewed_by).toBe(staff.id)
    expect(approvedRow?.resulting_profile_id).toBeNull()

    const { data: toReject, error: rejectInsertError } = await applicantClient
      .from('verification_requests')
      .insert({
        applicant_user_id: applicant.id,
        directory_id: universityDirectory.id,
        company_name: 'Staff Reject Target',
        business_email: 'staff-reject@example.test',
        claimant_name: 'Applicant',
        status: 'pending_review',
        verification_type: 'university',
        evidence_urls: [],
      })
      .select('id')
      .single()
    expect(rejectInsertError).toBeNull()
    track(toReject?.id)

    const { error: rejectError } = await staffClient.rpc('reject_verification_request', {
      p_verification_id: toReject!.id,
      p_review_notes: 'JID-102A1 staff rejection proof',
      p_rejection_reason: 'Incomplete evidence',
    })
    expect(rejectError).toBeNull()

    const { data: rejectedRow } = await admin
      .from('verification_requests')
      .select('status, rejection_reason, can_reapply_after')
      .eq('id', toReject!.id)
      .single()
    expect(rejectedRow?.status).toBe('rejected')
    expect(rejectedRow?.rejection_reason).toBe('Incomplete evidence')
    expect(rejectedRow?.can_reapply_after).not.toBeNull()
  })

  it('12 — Staff approval does not create a Profile', async () => {
    if (!admin || !env) return

    const { data: approved } = await admin
      .from('verification_requests')
      .select('id, resulting_profile_id, resulting_profile_type, status')
      .eq('applicant_user_id', applicant.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    expect(approved?.status).toBe('approved')
    expect(approved?.resulting_profile_id).toBeNull()
    expect(approved?.resulting_profile_type).toBeNull()

    const { count: bizCount } = await admin
      .from('business_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', applicant.id)
    expect(bizCount ?? 0).toBe(0)

    const { count: uniCount } = await admin
      .from('university_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', applicant.id)
    expect(uniCount ?? 0).toBe(0)
  })

  it('13 — rejection and reapplication remain functional', async () => {
    if (!admin || !env) return
    const applicantClient = await createAuthenticatedClient(env, applicant.email, applicant.password)
    const staffClient = await createAuthenticatedClient(env, staff.email, staff.password)

    const { data: first, error: firstError } = await applicantClient
      .from('verification_requests')
      .insert({
        applicant_user_id: applicant.id,
        directory_id: businessDirectory.id,
        company_name: 'Reapply Cycle',
        business_email: 'reapply@example.test',
        claimant_name: 'Applicant',
        status: 'pending_review',
        verification_type: 'business',
        evidence_urls: [],
      })
      .select('id')
      .single()
    expect(firstError).toBeNull()
    track(first?.id)

    const { error: rejectError } = await staffClient.rpc('reject_verification_request', {
      p_verification_id: first!.id,
      p_review_notes: 'Need more docs',
      p_rejection_reason: 'Need more docs',
    })
    expect(rejectError).toBeNull()

    // Clear cooldown so reapplication can be exercised in the same suite.
    const { error: cooldownClearError } = await admin
      .from('verification_requests')
      .update({ can_reapply_after: new Date(Date.now() - 60_000).toISOString() })
      .eq('id', first!.id)
    expect(cooldownClearError).toBeNull()

    const { data: second, error: secondError } = await applicantClient
      .from('verification_requests')
      .insert({
        applicant_user_id: applicant.id,
        directory_id: businessDirectory.id,
        company_name: 'Reapply Cycle 2',
        business_email: 'reapply2@example.test',
        claimant_name: 'Applicant',
        status: 'pending_review',
        verification_type: 'business',
        evidence_urls: [],
      })
      .select('id, status')
      .single()

    expect(secondError).toBeNull()
    expect(second?.status).toBe('pending_review')
    track(second?.id)
  })
})
