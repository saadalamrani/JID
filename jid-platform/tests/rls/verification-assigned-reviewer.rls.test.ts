// @vitest-environment node
/**
 * Spec 02 / Session B — disposable-local RPC authorization matrix.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL at 127.0.0.1/localhost plus anon +
 * service-role keys from a disposable stack that has applied migration 127
 * and tests/rls/fixtures/rls-test-role-helper.sql.
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

const NOTES = 'Disposable matrix review notes for Spec 02-B.'

describeRls('Spec 02-B assigned-reviewer authorization RPC matrix', () => {
  const service = env ? createServiceRoleClient(env) : null
  const requestIds = new Set<string>()

  let staffA: RlsRoleUser
  let staffB: RlsRoleUser
  let superAdmin: RlsRoleUser
  let adminUser: RlsRoleUser
  let applicant: RlsRoleUser
  let individual: RlsRoleUser
  let directory: DirectoryCompanyFixture

  beforeAll(async () => {
    if (!service) return
    staffA = await createRlsUserWithRole(service, '02b-staff-a', 'staff')
    staffB = await createRlsUserWithRole(service, '02b-staff-b', 'staff')
    superAdmin = await createRlsUserWithRole(service, '02b-super', 'super_admin')
    adminUser = await createRlsUserWithRole(service, '02b-admin', 'admin')
    applicant = await createRlsUserWithRole(service, '02b-applicant', 'individual')
    individual = await createRlsUserWithRole(service, '02b-individual', 'individual')
    directory = await createDirectoryCompany(service, '02b-dir', 'business')
  }, 120_000)

  afterAll(async () => {
    if (!service) return
    if (requestIds.size > 0) {
      await service.from('verification_requests').delete().in('id', Array.from(requestIds))
    }
    if (directory?.id) await deleteDirectoryCompany(service, directory.id)
    for (const user of [individual, applicant, adminUser, superAdmin, staffB, staffA]) {
      if (user?.id) await deleteRlsUser(service, user.id)
    }
  })

  async function insertRequest(opts: {
    assignedStaffId?: string | null
    applicantUserId?: string
    status?: string
  }) {
    const id = randomUUID()
    const { error } = await service!.from('verification_requests').insert({
      id,
      applicant_user_id: opts.applicantUserId ?? applicant.id,
      directory_id: directory.id,
      company_name: directory.name,
      business_email: `matrix@${directory.domain}`,
      claimant_name: 'Matrix Applicant',
      claimant_title: 'Representative',
      evidence_urls: [],
      status: opts.status ?? 'pending_review',
      verification_type: 'business',
      assigned_staff_id: opts.assignedStaffId ?? null,
    })
    if (error) throw new Error(`Failed to insert verification fixture: ${error.message}`)
    requestIds.add(id)
    return id
  }

  async function expectRpcDenied(
    client: Awaited<ReturnType<typeof createAuthenticatedClient>>,
    rpc: string,
    args: Record<string, unknown>,
    needle: string,
  ) {
    const { error } = await client.rpc(rpc as never, args as never)
    expect(error).not.toBeNull()
    expect(error!.message).toContain(needle)
  }

  it('NORMAL POSITIVE — A decides the request assigned to A', async () => {
    const id = await insertRequest({ assignedStaffId: staffA.id })
    const client = await createAuthenticatedClient(env!, staffA.email, staffA.password)
    const { error } = await client.rpc('approve_verification_request', {
      p_verification_id: id,
      p_review_notes: NOTES,
    })
    expect(error).toBeNull()
    const { data } = await service!
      .from('verification_requests')
      .select('status, assigned_staff_id')
      .eq('id', id)
      .single()
    expect(data?.status).toBe('approved')
    expect(data?.assigned_staff_id).toBe(staffA.id)
  })

  it('NORMAL POSITIVE — A decides an unassigned request and becomes assigned', async () => {
    const id = await insertRequest({ assignedStaffId: null })
    const client = await createAuthenticatedClient(env!, staffA.email, staffA.password)
    const { error } = await client.rpc('reject_verification_request', {
      p_verification_id: id,
      p_review_notes: NOTES,
      p_rejection_reason: NOTES,
    })
    expect(error).toBeNull()
    const { data } = await service!
      .from('verification_requests')
      .select('status, assigned_staff_id')
      .eq('id', id)
      .single()
    expect(data?.status).toBe('rejected')
    expect(data?.assigned_staff_id).toBe(staffA.id)
  })

  it('NORMAL NEGATIVE — B cannot decide A’s assigned request', async () => {
    const id = await insertRequest({ assignedStaffId: staffA.id })
    const client = await createAuthenticatedClient(env!, staffB.email, staffB.password)
    await expectRpcDenied(
      client,
      'approve_verification_request',
      { p_verification_id: id, p_review_notes: NOTES },
      'not_assigned_reviewer',
    )
  })

  it('NORMAL NEGATIVE — super_admin via normal RPC cannot decide B’s assigned request', async () => {
    const id = await insertRequest({ assignedStaffId: staffB.id })
    const client = await createAuthenticatedClient(env!, superAdmin.email, superAdmin.password)
    await expectRpcDenied(
      client,
      'reject_verification_request',
      { p_verification_id: id, p_review_notes: NOTES, p_rejection_reason: NOTES },
      'not_assigned_reviewer',
    )
  })

  it('NORMAL NEGATIVE — admin calling normal RPC is denied insufficient_privileges', async () => {
    const id = await insertRequest({ assignedStaffId: staffA.id })
    const client = await createAuthenticatedClient(env!, adminUser.email, adminUser.password)
    await expectRpcDenied(
      client,
      'approve_verification_request',
      { p_verification_id: id, p_review_notes: NOTES },
      'insufficient_privileges',
    )
  })

  it('NORMAL NEGATIVE — A cannot decide their own application', async () => {
    const id = await insertRequest({
      assignedStaffId: staffA.id,
      applicantUserId: staffA.id,
    })
    const client = await createAuthenticatedClient(env!, staffA.email, staffA.password)
    await expectRpcDenied(
      client,
      'approve_verification_request',
      { p_verification_id: id, p_review_notes: NOTES },
      'cannot_review_own_verification',
    )
  })

  it('NORMAL NEGATIVE — individual and anon are denied', async () => {
    const id = await insertRequest({ assignedStaffId: null })
    const individualClient = await createAuthenticatedClient(
      env!,
      individual.email,
      individual.password,
    )
    await expectRpcDenied(
      individualClient,
      'approve_verification_request',
      { p_verification_id: id, p_review_notes: NOTES },
      'insufficient_privileges',
    )

    const anon = createAnonClient(env!)
    const { error: anonError } = await anon.rpc('approve_verification_request', {
      p_verification_id: id,
      p_review_notes: NOTES,
    })
    expect(anonError).not.toBeNull()
  })

  it('OVERRIDE POSITIVE — super_admin override on B’s assigned request audits override', async () => {
    const id = await insertRequest({ assignedStaffId: staffB.id })
    const client = await createAuthenticatedClient(env!, superAdmin.email, superAdmin.password)
    const { error } = await client.rpc('approve_verification_request_override', {
      p_verification_id: id,
      p_review_notes: NOTES,
    })
    expect(error).toBeNull()

    const { data: audits, error: auditError } = await service!
      .from('audit_logs')
      .select('new_data')
      .eq('entity_id', id)
      .eq('action', 'verification.approved')
      .order('created_at', { ascending: false })
      .limit(1)
    expect(auditError).toBeNull()
    const payload = audits?.[0]?.new_data as Record<string, unknown> | undefined
    expect(payload?.assignment_overridden).toBe(true)
    expect(payload?.previous_assigned_staff_id).toBe(staffB.id)
  })

  it('OVERRIDE NEGATIVE — staff A calling override is denied', async () => {
    const id = await insertRequest({ assignedStaffId: staffB.id })
    const client = await createAuthenticatedClient(env!, staffA.email, staffA.password)
    await expectRpcDenied(
      client,
      'approve_verification_request_override',
      { p_verification_id: id, p_review_notes: NOTES },
      'insufficient_privileges',
    )
  })

  it('OVERRIDE NEGATIVE — admin calling override is denied', async () => {
    const id = await insertRequest({ assignedStaffId: staffB.id })
    const client = await createAuthenticatedClient(env!, adminUser.email, adminUser.password)
    await expectRpcDenied(
      client,
      'reject_verification_request_override',
      { p_verification_id: id, p_review_notes: NOTES, p_rejection_reason: NOTES },
      'insufficient_privileges',
    )
  })

  it('OVERRIDE NEGATIVE — super_admin cannot override-decide their own application', async () => {
    const id = await insertRequest({
      assignedStaffId: staffA.id,
      applicantUserId: superAdmin.id,
    })
    const client = await createAuthenticatedClient(env!, superAdmin.email, superAdmin.password)
    await expectRpcDenied(
      client,
      'approve_verification_request_override',
      { p_verification_id: id, p_review_notes: NOTES },
      'cannot_review_own_verification',
    )
  })

  it('OVERRIDE NEGATIVE — anon calling either override RPC is denied', async () => {
    const id = await insertRequest({ assignedStaffId: staffA.id })
    const anon = createAnonClient(env!)
    const { error: approveError } = await anon.rpc('approve_verification_request_override', {
      p_verification_id: id,
      p_review_notes: NOTES,
    })
    const { error: rejectError } = await anon.rpc('reject_verification_request_override', {
      p_verification_id: id,
      p_review_notes: NOTES,
      p_rejection_reason: NOTES,
    })
    expect(approveError).not.toBeNull()
    expect(rejectError).not.toBeNull()
  })
})
