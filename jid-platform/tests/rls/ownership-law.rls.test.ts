// @vitest-environment node
/**
 * Ownership Law RLS proofs (P-103)
 * Migrations: 109–113_companies_directory_lockdown through profile_moderation_functions
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createBusinessProfileFixture,
  createDirectoryCompany,
  createRlsUserWithRole,
  createVerificationRequestFixture,
  deleteBusinessProfile,
  deleteCorrectionSuggestionsForDirectory,
  deleteDirectoryCompany,
  deleteRlsUser,
  deleteVerificationRequest,
  type BusinessProfileFixture,
  type DirectoryFixture,
  type RlsRoleUser,
  type VerificationFixture,
} from './fixtures/ownership-law'
import {
  createAuthenticatedClient,
  createServiceRoleClient,
  getRlsTestEnv,
} from './helpers/supabase-clients'

const env = getRlsTestEnv()
const describeRls = env ? describe : describe.skip

describeRls('Ownership Law RLS — zero-leak proofs (P-103)', () => {
  const admin = env ? createServiceRoleClient(env) : null

  let ownerA: RlsRoleUser
  let ownerB: RlsRoleUser
  let staff: RlsRoleUser
  let outsider: RlsRoleUser

  let directoryA: DirectoryFixture
  let directoryB: DirectoryFixture
  let profileA: BusinessProfileFixture
  let profileB: BusinessProfileFixture
  let verification: VerificationFixture

  beforeAll(async () => {
    if (!admin || !env) return

    ownerA = await createRlsUserWithRole(admin, 'owner-a', 'company_admin')
    ownerB = await createRlsUserWithRole(admin, 'owner-b', 'company_admin')
    staff = await createRlsUserWithRole(admin, 'staff', 'staff')
    outsider = await createRlsUserWithRole(admin, 'outsider', 'individual')

    directoryA = await createDirectoryCompany(admin, 'a')
    directoryB = await createDirectoryCompany(admin, 'b')

    profileA = await createBusinessProfileFixture(admin, ownerA.id, directoryA.id, 'a')
    profileB = await createBusinessProfileFixture(admin, ownerB.id, directoryB.id, 'b')

    verification = await createVerificationRequestFixture(admin, outsider.id, directoryA.id, 'vr')
  })

  afterAll(async () => {
    if (!admin) return

    if (directoryA?.id) await deleteCorrectionSuggestionsForDirectory(admin, directoryA.id)
    if (directoryB?.id) await deleteCorrectionSuggestionsForDirectory(admin, directoryB.id)
    if (verification?.id) await deleteVerificationRequest(admin, verification.id)
    if (profileA?.id) await deleteBusinessProfile(admin, profileA.id)
    if (profileB?.id) await deleteBusinessProfile(admin, profileB.id)
    if (directoryA?.id) await deleteDirectoryCompany(admin, directoryA.id)
    if (directoryB?.id) await deleteDirectoryCompany(admin, directoryB.id)
    if (outsider?.id) await deleteRlsUser(admin, outsider.id)
    if (staff?.id) await deleteRlsUser(admin, staff.id)
    if (ownerB?.id) await deleteRlsUser(admin, ownerB.id)
    if (ownerA?.id) await deleteRlsUser(admin, ownerA.id)
  })

  it('1 — org owner CANNOT UPDATE companies (Directory) directly', async () => {
    if (!admin || !env) return
    const client = await createAuthenticatedClient(env, ownerA.email, ownerA.password)

    const { data, error } = await client
      .from('companies')
      .update({ city: 'RLS-Blocked-City' })
      .eq('id', directoryA.id)
      .select('id')

    expect(error).toBeNull()
    expect(data).toEqual([])

    const { data: row } = await admin.from('companies').select('city').eq('id', directoryA.id).single()
    expect(row?.city).not.toBe('RLS-Blocked-City')
  })

  it('2 — org owner CANNOT INSERT business_profiles directly', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, ownerA.email, ownerA.password)

    const { error } = await client.from('business_profiles').insert({
      directory_id: directoryA.id,
      owner_user_id: ownerA.id,
      display_name_ar: 'اختراق',
      status: 'draft',
    })

    expect(error).not.toBeNull()
  })

  it('3 — owner A CANNOT SELECT or UPDATE owner B business_profiles', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, ownerA.email, ownerA.password)

    const { data: peek, error: selectError } = await client
      .from('business_profiles')
      .select('id')
      .eq('id', profileB.id)
      .maybeSingle()

    expect(selectError).toBeNull()
    expect(peek).toBeNull()

    const { data: updated, error: updateError } = await client
      .from('business_profiles')
      .update({ display_name_ar: 'tampered' })
      .eq('id', profileB.id)
      .select('id')

    expect(updateError).toBeNull()
    expect(updated).toEqual([])
  })

  it('4 — user without owned profile CANNOT INSERT directory_correction_suggestions', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, outsider.email, outsider.password)

    const { error } = await client.from('directory_correction_suggestions').insert({
      directory_id: directoryA.id,
      suggested_by: outsider.id,
      field_name: 'city',
      suggested_value: 'Riyadh',
      reason: 'should fail',
    })

    expect(error).not.toBeNull()
  })

  it('5 — staff CANNOT UPDATE verification_requests.status directly', async () => {
    if (!admin || !env) return
    const client = await createAuthenticatedClient(env, staff.email, staff.password)

    const { data, error } = await client
      .from('verification_requests')
      .update({ status: 'approved' })
      .eq('id', verification.id)
      .select('id')

    // JID-102A1 may revoke table UPDATE (42501) in addition to zero UPDATE policies
    // (PostgREST empty result). Either denial shape must leave the row unchanged.
    const deniedByPrivilege = error?.code === '42501'
    const deniedByRls = error === null && Array.isArray(data) && data.length === 0
    expect(deniedByPrivilege || deniedByRls).toBe(true)

    const { data: row } = await admin
      .from('verification_requests')
      .select('status')
      .eq('id', verification.id)
      .single()

    expect(row?.status).toBe('pending_review')
  })

  it('6 — suspend_profile() blocks owner self-unsuspend via direct UPDATE', async () => {
    if (!admin || !env) return
    const staffClient = await createAuthenticatedClient(env, staff.email, staff.password)
    const ownerClient = await createAuthenticatedClient(env, ownerA.email, ownerA.password)

    const { error: suspendError } = await staffClient.rpc('suspend_profile', {
      p_profile_id: profileA.id,
      p_profile_type: 'business',
      p_reason: 'RLS test suspension',
    })
    expect(suspendError).toBeNull()

    const { data: suspended } = await admin
      .from('business_profiles')
      .select('status')
      .eq('id', profileA.id)
      .single()
    expect(suspended?.status).toBe('suspended')

    const { data: ownerUpdated, error: ownerUpdateError } = await ownerClient
      .from('business_profiles')
      .update({ status: 'draft' })
      .eq('id', profileA.id)
      .select('id')

    expect(ownerUpdateError).toBeNull()
    expect(ownerUpdated).toEqual([])

    const { data: stillSuspended } = await admin
      .from('business_profiles')
      .select('status')
      .eq('id', profileA.id)
      .single()
    expect(stillSuspended?.status).toBe('suspended')

    const { error: reinstateError } = await staffClient.rpc('reinstate_profile', {
      p_profile_id: profileA.id,
      p_profile_type: 'business',
      p_target_status: 'draft',
      p_reason: 'RLS test cleanup',
    })
    expect(reinstateError).toBeNull()
  })

  it('7 — directory_correction_suggestions rejects field_name outside allow-list (CHECK)', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, ownerA.email, ownerA.password)

    const { error } = await client.from('directory_correction_suggestions').insert({
      directory_id: directoryA.id,
      suggested_by: ownerA.id,
      field_name: 'claimed_by',
      suggested_value: ownerA.id,
      reason: 'injection attempt',
    })

    expect(error).not.toBeNull()
    expect(error?.message ?? '').toMatch(/check|violates|constraint/i)
  })
})
