// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { submitClaimRequest } from '@/lib/entity/claims'
import type { Database } from '@/lib/supabase/types'
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
type VerificationStatus = Database['public']['Enums']['claim_status_enum']

describeRls('JID-102A verification INSERT and Profile-creation boundary', () => {
  const admin = env ? createServiceRoleClient(env) : null
  const requestIds = new Set<string>()

  let applicant: RlsRoleUser
  let universityApplicant: RlsRoleUser
  let otherApplicant: RlsRoleUser
  let decisionApplicant: RlsRoleUser
  let reapplyApplicant: RlsRoleUser
  let staff: RlsRoleUser
  let businessDirectory: DirectoryCompanyFixture
  let universityDirectory: DirectoryCompanyFixture

  beforeAll(async () => {
    if (!admin) return
    applicant = await createRlsUserWithRole(admin, 'jid-102a-applicant', 'individual')
    universityApplicant = await createRlsUserWithRole(
      admin,
      'jid-102a-university-applicant',
      'individual',
    )
    otherApplicant = await createRlsUserWithRole(admin, 'jid-102a-other', 'individual')
    decisionApplicant = await createRlsUserWithRole(admin, 'jid-102a-decision', 'individual')
    reapplyApplicant = await createRlsUserWithRole(admin, 'jid-102a-reapply', 'individual')
    staff = await createRlsUserWithRole(admin, 'jid-102a-staff', 'staff')
    businessDirectory = await createDirectoryCompany(admin, 'jid-102a-business', 'business')
    universityDirectory = await createDirectoryCompany(admin, 'jid-102a-university', 'university')
  })

  afterAll(async () => {
    if (!admin) return
    if (requestIds.size > 0) {
      await admin.from('verification_requests').delete().in('id', Array.from(requestIds))
    }
    if (businessDirectory?.id) await deleteDirectoryCompany(admin, businessDirectory.id)
    if (universityDirectory?.id) await deleteDirectoryCompany(admin, universityDirectory.id)
    if (staff?.id) await deleteRlsUser(admin, staff.id)
    if (reapplyApplicant?.id) await deleteRlsUser(admin, reapplyApplicant.id)
    if (decisionApplicant?.id) await deleteRlsUser(admin, decisionApplicant.id)
    if (otherApplicant?.id) await deleteRlsUser(admin, otherApplicant.id)
    if (universityApplicant?.id) await deleteRlsUser(admin, universityApplicant.id)
    if (applicant?.id) await deleteRlsUser(admin, applicant.id)
  })

  function initialRequest(
    directory: DirectoryCompanyFixture,
    applicantUserId: string,
    status: VerificationStatus = 'pending_review',
  ) {
    return {
      applicant_user_id: applicantUserId,
      directory_id: directory.id,
      company_name: directory.name,
      business_email: `security@${directory.domain}`,
      claimant_name: 'Synthetic Applicant',
      claimant_title: 'Representative',
      evidence_urls: [],
      verification_type: directory.entityType,
      status,
    } as const
  }

  it('denies anonymous verification INSERT', async () => {
    if (!env) return
    const { error } = await createAnonClient(env)
      .from('verification_requests')
      .insert(initialRequest(businessDirectory, applicant.id))
    expect(error).not.toBeNull()
  })

  it('allows the legitimate Business and University initial submission path', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, applicant.email, applicant.password)
    const universityClient = await createAuthenticatedClient(
      env,
      universityApplicant.email,
      universityApplicant.password,
    )

    const business = await submitClaimRequest(client, {
      companyId: businessDirectory.id,
      companyName: businessDirectory.name,
      claimType: 'company',
      business_email: `representative@${businessDirectory.domain}`,
      claimant_name: 'Business Representative',
      claimant_title: 'Authorized Representative',
      locale: 'en',
    })
    const university = await submitClaimRequest(universityClient, {
      companyId: universityDirectory.id,
      companyName: universityDirectory.name,
      claimType: 'university',
      business_email: `representative@${universityDirectory.domain}`,
      claimant_name: 'University Representative',
      claimant_title: 'Authorized Representative',
      locale: 'en',
    })

    expect(business.status).toBe('pending_review')
    expect(university.status).toBe('pending_review')
    requestIds.add(business.id)
    requestIds.add(university.id)

    const { error: duplicateError } = await client
      .from('verification_requests')
      .insert(initialRequest(businessDirectory, applicant.id))
    expect(duplicateError?.message).toContain('active_verification_request_exists')
  })

  it('denies every non-initial applicant-supplied status', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, otherApplicant.email, otherApplicant.password)
    const deniedStatuses: VerificationStatus[] = [
      'pending',
      'submitted',
      'under_review',
      'needs_more_info',
      'approved',
      'rejected',
      'cancelled',
    ]

    for (const status of deniedStatuses) {
      const { error } = await client
        .from('verification_requests')
        .insert(initialRequest(businessDirectory, otherApplicant.id, status))
      expect(error, status).not.toBeNull()
    }
  })

  it('denies reviewer, decision, moderation, and audit fields', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, otherApplicant.email, otherApplicant.password)
    const attempts = [
      { reviewed_by: otherApplicant.id },
      { reviewed_at: new Date().toISOString() },
      { review_notes: 'synthetic' },
      { rejection_reason: 'synthetic' },
      { can_reapply_after: new Date().toISOString() },
      { required_documents: ['synthetic'] },
      { domain_verified: true },
      { verified_domains: [businessDirectory.domain] },
      { assigned_staff_id: staff.id },
      { first_viewed_by: staff.id },
      { first_viewed_at: new Date().toISOString() },
      { sla_due_at: new Date().toISOString() },
      { created_at: new Date(0).toISOString() },
      { updated_at: new Date(0).toISOString() },
    ]

    for (const fields of attempts) {
      const { error } = await client
        .from('verification_requests')
        .insert({ ...initialRequest(businessDirectory, otherApplicant.id), ...fields })
      expect(error).not.toBeNull()
    }
  })

  it('denies applicant-supplied resulting Profile fields', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, otherApplicant.email, otherApplicant.password)
    const { error } = await client.from('verification_requests').insert({
      ...initialRequest(businessDirectory, otherApplicant.id),
      resulting_profile_id: crypto.randomUUID(),
      resulting_profile_type: 'business',
    })
    expect(error).not.toBeNull()
  })

  it('denies submission on behalf of another applicant', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, applicant.email, applicant.password)
    const { error } = await client
      .from('verification_requests')
      .insert(initialRequest(businessDirectory, otherApplicant.id))
    expect(error).not.toBeNull()
  })

  it('denies incompatible type, Directory name, and institutional domain relationships', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, otherApplicant.email, otherApplicant.password)
    const attempts = [
      {
        ...initialRequest(universityDirectory, otherApplicant.id),
        verification_type: 'business' as const,
      },
      {
        ...initialRequest(businessDirectory, otherApplicant.id),
        company_name: 'Different Directory Record',
      },
      {
        ...initialRequest(businessDirectory, otherApplicant.id),
        business_email: 'representative@unrelated.test',
      },
    ]

    for (const attempt of attempts) {
      const { error } = await client.from('verification_requests').insert(attempt)
      expect(error).not.toBeNull()
    }
  })

  it('denies Profile creation for pending Business and University verification', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, applicant.email, applicant.password)
    const universityClient = await createAuthenticatedClient(
      env,
      universityApplicant.email,
      universityApplicant.password,
    )
    const { data: businessRequests } = await client
      .from('verification_requests')
      .select('id, verification_type')
      .eq('status', 'pending_review')
    const { data: universityRequests } = await universityClient
      .from('verification_requests')
      .select('id, verification_type')
      .eq('status', 'pending_review')

    const business = businessRequests?.find((request) => request.verification_type === 'business')
    const university = universityRequests?.find(
      (request) => request.verification_type === 'university',
    )
    expect(business).toBeDefined()
    expect(university).toBeDefined()

    const { error: businessError } = await client.rpc('create_business_profile', {
      p_verification_id: business!.id,
      p_display_name_ar: 'Business',
      p_display_name_en: 'Business',
    })
    const { error: universityError } = await universityClient.rpc('create_university_profile', {
      p_verification_id: university!.id,
      p_display_name_ar: 'University',
      p_display_name_en: 'University',
    })

    expect(businessError?.message).toContain('verification_not_approved')
    expect(universityError?.message).toContain('verification_not_approved')
  })

  it('keeps Staff approval RPC-controlled, audited, and separate from Profile creation', async () => {
    if (!admin || !env) return
    const applicantClient = await createAuthenticatedClient(
      env,
      decisionApplicant.email,
      decisionApplicant.password,
    )
    const staffClient = await createAuthenticatedClient(env, staff.email, staff.password)
    const request = await submitClaimRequest(applicantClient, {
      companyId: businessDirectory.id,
      companyName: businessDirectory.name,
      claimType: 'company',
      business_email: `decision@${businessDirectory.domain}`,
      claimant_name: 'Decision Applicant',
      claimant_title: 'Representative',
      locale: 'en',
    })
    requestIds.add(request.id)

    const { error } = await staffClient.rpc('approve_verification_request', {
      p_verification_id: request.id,
      p_review_notes: 'Synthetic approval evidence',
      p_verified_domains: [businessDirectory.domain],
    })
    expect(error).toBeNull()

    const { data: approved } = await admin
      .from('verification_requests')
      .select('status, reviewed_by, resulting_profile_id')
      .eq('id', request.id)
      .single()
    if (!approved) throw new Error('Approved verification row was not returned')
    const { count: profileCount } = await admin
      .from('business_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', decisionApplicant.id)
    const { count: auditCount } = await admin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('actor_id', staff.id)
      .eq('action', 'verification.approved')
      .eq('entity_id', request.id)

    expect(approved.status).toBe('approved')
    expect(approved.reviewed_by).toBe(staff.id)
    expect(approved.resulting_profile_id).toBeNull()
    expect(profileCount).toBe(0)
    expect(auditCount).toBe(1)
  })

  it('keeps rejection audited and legitimate reapplication behavior functional', async () => {
    if (!admin || !env) return
    const applicantClient = await createAuthenticatedClient(
      env,
      reapplyApplicant.email,
      reapplyApplicant.password,
    )
    const staffClient = await createAuthenticatedClient(env, staff.email, staff.password)
    const request = await submitClaimRequest(applicantClient, {
      companyId: universityDirectory.id,
      companyName: universityDirectory.name,
      claimType: 'university',
      business_email: `reapply@${universityDirectory.domain}`,
      claimant_name: 'Reapply Applicant',
      claimant_title: 'Representative',
      locale: 'en',
    })
    requestIds.add(request.id)

    const { error: rejectError } = await staffClient.rpc('reject_verification_request', {
      p_verification_id: request.id,
      p_review_notes: 'Synthetic rejection evidence',
      p_rejection_reason: 'Synthetic missing evidence',
      p_required_documents: ['authorization_letter'],
    })
    expect(rejectError).toBeNull()

    const { error: directCooldownError } = await applicantClient
      .from('verification_requests')
      .insert(initialRequest(universityDirectory, reapplyApplicant.id))
    expect(directCooldownError?.message).toContain('verification_reapplication_cooldown_active')

    await expect(
      submitClaimRequest(applicantClient, {
        companyId: universityDirectory.id,
        companyName: universityDirectory.name,
        claimType: 'university',
        business_email: `reapply@${universityDirectory.domain}`,
        claimant_name: 'Reapply Applicant',
        claimant_title: 'Representative',
        locale: 'en',
      }),
    ).rejects.toThrow(/cannot reapply before/i)

    await admin
      .from('verification_requests')
      .update({ can_reapply_after: new Date(Date.now() - 60_000).toISOString() })
      .eq('id', request.id)

    const reapplied = await submitClaimRequest(applicantClient, {
      companyId: universityDirectory.id,
      companyName: universityDirectory.name,
      claimType: 'university',
      business_email: `reapply@${universityDirectory.domain}`,
      claimant_name: 'Reapply Applicant',
      claimant_title: 'Representative',
      locale: 'en',
    })
    requestIds.add(reapplied.id)
    expect(reapplied.status).toBe('pending_review')

    const { count: auditCount } = await admin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('actor_id', staff.id)
      .eq('action', 'verification.rejected')
      .eq('entity_id', request.id)
    expect(auditCount).toBe(1)
  })
})
