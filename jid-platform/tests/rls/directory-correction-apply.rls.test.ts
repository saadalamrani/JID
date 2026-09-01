// @vitest-environment node
/**
 * Spec 06-C — Disposable-database positive/negative/atomicity matrix for
 * Directory correction approve/reject (Session 06-B apply path).
 * Runs only against a local disposable Supabase (skipped otherwise).
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

describeRls('Directory correction apply path (Spec 06-C disposable matrix)', () => {
  const admin = env ? createServiceRoleClient(env) : null

  let staff: RlsRoleUser
  let individual: RlsRoleUser
  let suggester: RlsRoleUser
  let otherSuggester: RlsRoleUser
  let directory: DirectoryCompanyFixture
  let pendingApproveId: string
  let pendingRejectId: string
  let alreadyDecidedId: string
  let doubleDecisionId: string
  let whitelistViolationId: string
  let ownershipFieldId: string
  let missingTargetId: string
  let missingDirectoryId: string
  let atomicFailId: string
  let atomicFailDirectoryId: string

  beforeAll(async () => {
    if (!admin) return
    staff = await createRlsUserWithRole(admin, 'corr-staff', 'staff')
    individual = await createRlsUserWithRole(admin, 'corr-individual', 'individual')
    suggester = await createRlsUserWithRole(admin, 'corr-suggester', 'individual')
    otherSuggester = await createRlsUserWithRole(admin, 'corr-other-sug', 'individual')
    directory = await createDirectoryCompany(admin, 'corr-dir')

    // Seed baseline city so approval change is observable.
    const { error: citySeedError } = await admin
      .from('companies')
      .update({ city: 'Riyadh', website_url: 'https://before.example.test' })
      .eq('id', directory.id)
    if (citySeedError) throw new Error(citySeedError.message)

    const insertSuggestion = async (
      fieldName: string,
      suggestedValue: string,
      suggestedBy = suggester.id,
      directoryId = directory.id,
    ) => {
      const id = randomUUID()
      const { error } = await admin.from('directory_correction_suggestions').insert({
        id,
        directory_id: directoryId,
        suggested_by: suggestedBy,
        field_name: fieldName,
        current_value: 'Riyadh',
        suggested_value: suggestedValue,
        reason: 'fixture',
        status: 'pending',
      })
      if (error) throw new Error(error.message)
      return id
    }

    pendingApproveId = await insertSuggestion('city', 'Jeddah')
    pendingRejectId = await insertSuggestion('city', 'Dammam')
    doubleDecisionId = await insertSuggestion('website_url', 'https://after.example.test')

    alreadyDecidedId = await insertSuggestion('linkedin_url', 'https://linkedin.example/x')
    const staffClient = await createAuthenticatedClient(env!, staff.email, staff.password)
    const decided = await staffClient.rpc('reject_correction_suggestion', {
      p_suggestion_id: alreadyDecidedId,
      p_review_notes: 'Pre-decided fixture',
    })
    if (decided.error) throw new Error(decided.error.message)

    const insertRaw = async (fieldName: string, suggestedValue: string) => {
      const id = randomUUID()
      const { error } = await admin.rpc('rls_test_insert_correction_suggestion', {
        p_id: id,
        p_directory_id: directory.id,
        p_suggested_by: suggester.id,
        p_field_name: fieldName,
        p_current_value: 'baseline',
        p_suggested_value: suggestedValue,
        p_reason: 'fixture',
      })
      if (error) throw new Error(error.message)
      return id
    }

    whitelistViolationId = await insertRaw('claimed_by', randomUUID())
    ownershipFieldId = await insertRaw('is_verified', 'true')

    missingDirectoryId = randomUUID()
    missingTargetId = randomUUID()
    const { error: missingError } = await admin.rpc(
      'rls_test_insert_orphan_correction_suggestion',
      {
        p_id: missingTargetId,
        p_directory_id: missingDirectoryId,
        p_suggested_by: suggester.id,
        p_field_name: 'city',
        p_current_value: 'Riyadh',
        p_suggested_value: 'MissingCity',
        p_reason: 'fixture',
      },
    )
    if (missingError) throw new Error(missingError.message)

    atomicFailDirectoryId = randomUUID()
    atomicFailId = randomUUID()
    const { error: atomicError } = await admin.rpc(
      'rls_test_insert_orphan_correction_suggestion',
      {
        p_id: atomicFailId,
        p_directory_id: atomicFailDirectoryId,
        p_suggested_by: suggester.id,
        p_field_name: 'city',
        p_current_value: 'Riyadh',
        p_suggested_value: 'AtomicCity',
        p_reason: 'fixture',
      },
    )
    if (atomicError) throw new Error(atomicError.message)
  }, 120_000)

  afterAll(async () => {
    if (!admin) return
    const ids = [
      pendingApproveId,
      pendingRejectId,
      alreadyDecidedId,
      doubleDecisionId,
      whitelistViolationId,
      ownershipFieldId,
      missingTargetId,
      atomicFailId,
    ].filter(Boolean)
    if (ids.length > 0) {
      await admin.from('directory_correction_suggestions').delete().in('id', ids)
    }
    if (directory?.id) await deleteDirectoryCompany(admin, directory.id)
    for (const user of [staff, individual, suggester, otherSuggester]) {
      if (user?.id) await deleteRlsUser(admin, user.id)
    }
  }, 120_000)

  it('POSITIVE A — approval applies exactly one whitelist field, audit, and suggester notification', async () => {
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    const before = await admin!
      .from('companies')
      .select(
        'city, website_url, career_portal_url, linkedin_url, twitter_url, sector_id, region_id, is_verified, is_active, name, name_ar',
      )
      .eq('id', directory.id)
      .single()

    const { error } = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: pendingApproveId,
      p_review_notes: 'Approved city correction',
    })
    expect(error).toBeNull()

    const after = await admin!
      .from('companies')
      .select(
        'city, website_url, career_portal_url, linkedin_url, twitter_url, sector_id, region_id, is_verified, is_active, name, name_ar',
      )
      .eq('id', directory.id)
      .single()
    expect(after.data?.city).toBe('Jeddah')
    expect(after.data?.website_url).toBe(before.data?.website_url)
    expect(after.data?.career_portal_url).toBe(before.data?.career_portal_url)
    expect(after.data?.linkedin_url).toBe(before.data?.linkedin_url)
    expect(after.data?.twitter_url).toBe(before.data?.twitter_url)
    expect(after.data?.sector_id).toBe(before.data?.sector_id)
    expect(after.data?.region_id).toBe(before.data?.region_id)
    expect(after.data?.is_verified).toBe(before.data?.is_verified)
    expect(after.data?.is_active).toBe(before.data?.is_active)
    expect(after.data?.name).toBe(before.data?.name)
    expect(after.data?.name_ar).toBe(before.data?.name_ar)

    const { data: suggestion } = await admin!
      .from('directory_correction_suggestions')
      .select('status, reviewed_by')
      .eq('id', pendingApproveId)
      .single()
    expect(suggestion?.status).toBe('approved')
    expect(suggestion?.reviewed_by).toBe(staff.id)

    const { data: notifications } = await admin!
      .from('notifications')
      .select('category, recipient_id, idempotency_key')
      .eq('recipient_id', suggester.id)
      .eq('category', 'directory.correction_approved')
      .eq('idempotency_key', `directory.correction:${pendingApproveId}:approved`)
    expect((notifications ?? []).length).toBe(1)

    const { data: audits } = await admin!
      .from('audit_logs')
      .select('action, entity_id, actor_id')
      .eq('action', 'directory.corrected')
      .eq('entity_id', directory.id)
      .eq('actor_id', staff.id)
    expect((audits ?? []).length).toBeGreaterThanOrEqual(1)
  })

  it('POSITIVE B — rejection changes no Directory field and records decision + audit + notification', async () => {
    const before = await admin!
      .from('companies')
      .select('city, website_url, is_verified')
      .eq('id', directory.id)
      .single()
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    const { error } = await client.rpc('reject_correction_suggestion', {
      p_suggestion_id: pendingRejectId,
      p_review_notes: 'Rejected — inaccurate',
    })
    expect(error).toBeNull()

    const after = await admin!
      .from('companies')
      .select('city, website_url, is_verified')
      .eq('id', directory.id)
      .single()
    expect(after.data).toEqual(before.data)

    const { data: suggestion } = await admin!
      .from('directory_correction_suggestions')
      .select('status')
      .eq('id', pendingRejectId)
      .single()
    expect(suggestion?.status).toBe('rejected')

    const { data: notifications } = await admin!
      .from('notifications')
      .select('category')
      .eq('recipient_id', suggester.id)
      .eq('category', 'directory.correction_rejected')
      .eq('idempotency_key', `directory.correction:${pendingRejectId}:rejected`)
    expect((notifications ?? []).length).toBe(1)

    const { data: audits } = await admin!
      .from('audit_logs')
      .select('action, entity_id')
      .eq('action', 'directory.correction_rejected')
      .eq('entity_id', pendingRejectId)
    expect((audits ?? []).length).toBe(1)
  })

  it('NEGATIVE — non-staff RPC invocation denied', async () => {
    const client = await createAuthenticatedClient(env!, individual.email, individual.password)
    const { error } = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: doubleDecisionId,
      p_review_notes: 'Should fail',
    })
    expect(error?.message ?? '').toMatch(/insufficient_privileges/)
  })

  it('NEGATIVE — anonymous privileged invocation denied', async () => {
    const anon = createAnonClient(env!)
    const { error } = await anon.rpc('approve_correction_suggestion', {
      p_suggestion_id: doubleDecisionId,
      p_review_notes: 'Anon should fail',
    })
    expect(error).toBeTruthy()
  })

  it('NEGATIVE — non-whitelisted field denied', async () => {
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    const before = await admin!
      .from('companies')
      .select('city')
      .eq('id', directory.id)
      .single()
    const { error } = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: whitelistViolationId,
      p_review_notes: 'Should deny non-whitelist field',
    })
    expect(error?.message ?? '').toMatch(/field_not_allowed/)
    const after = await admin!
      .from('companies')
      .select('city')
      .eq('id', directory.id)
      .single()
    expect(after.data).toEqual(before.data)
  })

  it('NEGATIVE — Profile/ownership/Verification/status field attempt denied', async () => {
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    const before = await admin!
      .from('companies')
      .select('is_verified, is_active')
      .eq('id', directory.id)
      .single()
    const { error } = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: ownershipFieldId,
      p_review_notes: 'Should deny ownership/verification field',
    })
    expect(error?.message ?? '').toMatch(/field_not_allowed/)
    const after = await admin!
      .from('companies')
      .select('is_verified, is_active')
      .eq('id', directory.id)
      .single()
    expect(after.data).toEqual(before.data)
  })

  it('NEGATIVE — double-decision / already-decided denied', async () => {
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    const first = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: doubleDecisionId,
      p_review_notes: 'First decision',
    })
    expect(first.error).toBeNull()

    const second = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: doubleDecisionId,
      p_review_notes: 'Second decision',
    })
    expect(second.error?.message ?? '').toMatch(/invalid_or_reviewed/)

    const already = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: alreadyDecidedId,
      p_review_notes: 'Already rejected',
    })
    expect(already.error?.message ?? '').toMatch(/invalid_or_reviewed/)
  })

  it('NEGATIVE — missing Directory target fails honestly with no orphan write', async () => {
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    const { error } = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: missingTargetId,
      p_review_notes: 'Missing directory',
    })
    expect(error?.message ?? '').toMatch(/directory_missing/)

    const { data: suggestion } = await admin!
      .from('directory_correction_suggestions')
      .select('status')
      .eq('id', missingTargetId)
      .single()
    expect(suggestion?.status).toBe('pending')

    const { data: orphan } = await admin!
      .from('companies')
      .select('id')
      .eq('id', missingDirectoryId)
    expect(orphan ?? []).toEqual([])

    const { data: audits } = await admin!
      .from('audit_logs')
      .select('id')
      .eq('action', 'directory.corrected')
      .contains('new_data', { suggestion_id: missingTargetId })
    expect((audits ?? []).length).toBe(0)

    const { data: notifications } = await admin!
      .from('notifications')
      .select('id')
      .eq('idempotency_key', `directory.correction:${missingTargetId}:approved`)
    expect((notifications ?? []).length).toBe(0)
  })

  it('ATOMICITY — failing approval leaves no partial Directory/decision/audit/notification writes', async () => {
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    const { error } = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: atomicFailId,
      p_review_notes: 'Atomic fail case',
    })
    expect(error?.message ?? '').toMatch(/directory_missing/)

    const { data: suggestion } = await admin!
      .from('directory_correction_suggestions')
      .select('status, reviewed_by, reviewed_at')
      .eq('id', atomicFailId)
      .single()
    expect(suggestion?.status).toBe('pending')
    expect(suggestion?.reviewed_by).toBeNull()
    expect(suggestion?.reviewed_at).toBeNull()

    const { data: companies } = await admin!
      .from('companies')
      .select('id')
      .eq('id', atomicFailDirectoryId)
    expect(companies ?? []).toEqual([])

    const { data: audits } = await admin!
      .from('audit_logs')
      .select('id')
      .contains('new_data', { suggestion_id: atomicFailId })
    expect((audits ?? []).length).toBe(0)

    const { data: notifications } = await admin!
      .from('notifications')
      .select('id')
      .eq('idempotency_key', `directory.correction:${atomicFailId}:approved`)
    expect((notifications ?? []).length).toBe(0)
  })

  it('NEGATIVE — suggester selects only own suggestions; not another user private suggestion', async () => {
    const own = await createAuthenticatedClient(env!, suggester.email, suggester.password)
    const { data: ownRows, error: ownError } = await own
      .from('directory_correction_suggestions')
      .select('id')
      .eq('id', pendingRejectId)
    expect(ownError).toBeNull()
    expect((ownRows ?? []).length).toBe(1)

    const other = await createAuthenticatedClient(
      env!,
      otherSuggester.email,
      otherSuggester.password,
    )
    const { data: otherRows, error: otherError } = await other
      .from('directory_correction_suggestions')
      .select('id')
      .eq('id', pendingRejectId)
    expect(otherError).toBeNull()
    expect(otherRows).toEqual([])
  })

  it('NEGATIVE — anonymous user reads no private suggestion data', async () => {
    const anon = createAnonClient(env!)
    const { data, error } = await anon
      .from('directory_correction_suggestions')
      .select('id, suggested_value, reason')
      .eq('id', pendingRejectId)
    // Either RLS empty set or explicit denial — never private payload.
    if (error) {
      expect(error).toBeTruthy()
    } else {
      expect(data ?? []).toEqual([])
    }
  })

  it('NEGATIVE — direct unauthorized companies mutation remains denied', async () => {
    const client = await createAuthenticatedClient(env!, individual.email, individual.password)
    const before = await admin!
      .from('companies')
      .select('city')
      .eq('id', directory.id)
      .single()
    const { error, data } = await client
      .from('companies')
      .update({ city: 'HackedCity' })
      .eq('id', directory.id)
      .select('id')
    expect(data ?? []).toEqual([])
    // PostgREST may return empty with null error under RLS, or an error.
    void error
    const after = await admin!
      .from('companies')
      .select('city')
      .eq('id', directory.id)
      .single()
    expect(after.data?.city).toBe(before.data?.city)
  })

  it('NEGATIVE — ordinary client cannot forge audit or notification rows', async () => {
    const client = await createAuthenticatedClient(env!, individual.email, individual.password)
    const { error: auditError } = await client.from('audit_logs').insert({
      actor_id: individual.id,
      action: 'directory.corrected',
      entity_type: 'company',
      entity_id: directory.id,
      before_state: {},
      after_state: { forged: true },
    })
    expect(auditError).toBeTruthy()

    const { error: notificationError } = await client.from('notifications').insert({
      recipient_id: individual.id,
      category: 'directory.correction_approved',
      title_ar: 'مزور',
      title_en: 'Forged',
      body_ar: 'مزور',
      body_en: 'Forged',
      priority: 'normal',
      idempotency_key: `forge:${randomUUID()}`,
    })
    expect(notificationError).toBeTruthy()
  })
})
