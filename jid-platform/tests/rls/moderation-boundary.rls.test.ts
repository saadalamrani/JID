// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createBusinessProfileFixture,
  createDirectoryCompany,
  createRlsUserWithRole,
  createUniversityProfileFixture,
  deleteBusinessProfile,
  deleteDirectoryCompany,
  deleteRlsUser,
  deleteUniversityProfile,
  type BusinessProfileFixture,
  type DirectoryFixture,
  type RlsRoleUser,
  type UniversityProfileFixture,
} from './fixtures/ownership-law'
import {
  createAuthenticatedClient,
  createServiceRoleClient,
  getRlsTestEnv,
} from './helpers/supabase-clients'

const env = getRlsTestEnv()
const describeRls = env ? describe : describe.skip

describeRls('Suspended owned-profile transition boundary (JID-107)', () => {
  const admin = env ? createServiceRoleClient(env) : null

  let businessA: RlsRoleUser
  let businessB: RlsRoleUser
  let universityA: RlsRoleUser
  let universityB: RlsRoleUser
  let staff: RlsRoleUser
  let businessDirectoryA: DirectoryFixture
  let businessDirectoryB: DirectoryFixture
  let universityDirectoryA: DirectoryFixture
  let universityDirectoryB: DirectoryFixture
  let businessProfileA: BusinessProfileFixture
  let businessProfileB: BusinessProfileFixture
  let universityProfileA: UniversityProfileFixture
  let universityProfileB: UniversityProfileFixture

  beforeAll(async () => {
    if (!admin) return
    businessA = await createRlsUserWithRole(admin, 'boundary-business-a', 'company_admin')
    businessB = await createRlsUserWithRole(admin, 'boundary-business-b', 'company_admin')
    universityA = await createRlsUserWithRole(admin, 'boundary-university-a', 'university_admin')
    universityB = await createRlsUserWithRole(admin, 'boundary-university-b', 'university_admin')
    staff = await createRlsUserWithRole(admin, 'boundary-staff', 'staff')

    businessDirectoryA = await createDirectoryCompany(admin, 'boundary-business-a')
    businessDirectoryB = await createDirectoryCompany(admin, 'boundary-business-b')
    universityDirectoryA = await createDirectoryCompany(admin, 'boundary-university-a', 'university')
    universityDirectoryB = await createDirectoryCompany(admin, 'boundary-university-b', 'university')

    businessProfileA = await createBusinessProfileFixture(admin, businessA.id, businessDirectoryA.id, 'boundary-a')
    businessProfileB = await createBusinessProfileFixture(admin, businessB.id, businessDirectoryB.id, 'boundary-b')
    universityProfileA = await createUniversityProfileFixture(admin, universityA.id, universityDirectoryA.id, 'boundary-a')
    universityProfileB = await createUniversityProfileFixture(admin, universityB.id, universityDirectoryB.id, 'boundary-b')
  })

  afterAll(async () => {
    if (!admin) return
    if (businessProfileA?.id) await deleteBusinessProfile(admin, businessProfileA.id)
    if (businessProfileB?.id) await deleteBusinessProfile(admin, businessProfileB.id)
    if (universityProfileA?.id) await deleteUniversityProfile(admin, universityProfileA.id)
    if (universityProfileB?.id) await deleteUniversityProfile(admin, universityProfileB.id)
    for (const directory of [businessDirectoryA, businessDirectoryB, universityDirectoryA, universityDirectoryB]) {
      if (directory?.id) await deleteDirectoryCompany(admin, directory.id)
    }
    for (const user of [staff, universityB, universityA, businessB, businessA]) {
      if (user?.id) await deleteRlsUser(admin, user.id)
    }
  })

  it('1 — Business owner can edit permitted content on own non-suspended profile', async () => {
    const client = await createAuthenticatedClient(env!, businessA.email, businessA.password)
    const { data, error } = await client.from('business_profiles').update({ about_en: 'Owner content' }).eq('id', businessProfileA.id).select('about_en').single()
    expect(error).toBeNull()
    expect(data?.about_en).toBe('Owner content')
  })

  it('2 — Business owner cannot edit another owner profile', async () => {
    const client = await createAuthenticatedClient(env!, businessA.email, businessA.password)
    const { data, error } = await client.from('business_profiles').update({ about_en: 'Cross-owner' }).eq('id', businessProfileB.id).select('id')
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('3 — Business owner cannot directly change profile status', async () => {
    const client = await createAuthenticatedClient(env!, businessA.email, businessA.password)
    const { error } = await client.from('business_profiles').update({ status: 'published' }).eq('id', businessProfileA.id)
    expect(error?.message ?? '').toMatch(/profile_moderation_fields_require_staff/)
  })

  it('4 — University owner can edit permitted content on own non-suspended profile', async () => {
    const client = await createAuthenticatedClient(env!, universityA.email, universityA.password)
    const { data, error } = await client.from('university_profiles').update({ about_en: 'University content' }).eq('id', universityProfileA.id).select('about_en').single()
    expect(error).toBeNull()
    expect(data?.about_en).toBe('University content')
  })

  it('5 — University owner cannot edit another owner profile', async () => {
    const client = await createAuthenticatedClient(env!, universityA.email, universityA.password)
    const { data, error } = await client.from('university_profiles').update({ about_en: 'Cross-owner' }).eq('id', universityProfileB.id).select('id')
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('6 — University owner cannot directly change profile status', async () => {
    const client = await createAuthenticatedClient(env!, universityA.email, universityA.password)
    const { error } = await client.from('university_profiles').update({ status: 'published' }).eq('id', universityProfileA.id)
    expect(error?.message ?? '').toMatch(/profile_moderation_fields_require_staff/)
  })

  it('7 — Staff suspension succeeds for Business and University Profiles with audit evidence', async () => {
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    for (const [id, type] of [[businessProfileA.id, 'business'], [universityProfileA.id, 'university']] as const) {
      const { error } = await client.rpc('suspend_profile', { p_profile_id: id, p_profile_type: type, p_reason: 'JID-107 boundary test' })
      expect(error).toBeNull()
    }
    const { data: audits, error: auditError } = await admin!.from('audit_logs').select('entity_id').eq('action', 'profile.suspended').in('entity_id', [businessProfileA.id, universityProfileA.id])
    expect(auditError).toBeNull()
    expect(audits).toHaveLength(2)
  })

  it('8 — Suspended Business Profile owner cannot self-unsuspend or edit around suspension', async () => {
    const client = await createAuthenticatedClient(env!, businessA.email, businessA.password)
    const { data, error } = await client.from('business_profiles').update({ status: 'draft', about_en: 'Bypass' }).eq('id', businessProfileA.id).select('id')
    expect(error).toBeNull()
    expect(data).toEqual([])
    const { data: row } = await admin!.from('business_profiles').select('status, about_en').eq('id', businessProfileA.id).single()
    expect(row).toMatchObject({ status: 'suspended', about_en: 'Owner content' })
  })

  it('9 — Suspended University Profile owner cannot self-unsuspend or edit around suspension', async () => {
    const client = await createAuthenticatedClient(env!, universityA.email, universityA.password)
    const { data, error } = await client.from('university_profiles').update({ status: 'draft', about_en: 'Bypass' }).eq('id', universityProfileA.id).select('id')
    expect(error).toBeNull()
    expect(data).toEqual([])
    const { data: row } = await admin!.from('university_profiles').select('status, about_en').eq('id', universityProfileA.id).single()
    expect(row).toMatchObject({ status: 'suspended', about_en: 'University content' })
  })

  it('10 — Staff reinstatement succeeds for both profile types with audit evidence', async () => {
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    for (const [id, type] of [[businessProfileA.id, 'business'], [universityProfileA.id, 'university']] as const) {
      const { error } = await client.rpc('reinstate_profile', { p_profile_id: id, p_profile_type: type, p_target_status: 'draft', p_reason: 'JID-107 verified cleanup' })
      expect(error).toBeNull()
    }
    const { data: audits, error: auditError } = await admin!.from('audit_logs').select('entity_id').eq('action', 'profile.reinstated').in('entity_id', [businessProfileA.id, universityProfileA.id])
    expect(auditError).toBeNull()
    expect(audits).toHaveLength(2)
  })
})
