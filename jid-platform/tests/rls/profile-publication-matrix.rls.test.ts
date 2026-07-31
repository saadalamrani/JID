// @vitest-environment node
/**
 * Spec 07-C — Complete publication disposable-DB authorization / RLS matrix.
 * Skips without local disposable env. Synthetic fixtures only.
 */
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
  createAnonClient,
  createAuthenticatedClient,
  createServiceRoleClient,
  getRlsTestEnv,
} from './helpers/supabase-clients'

const env = getRlsTestEnv()
const describeRls = env ? describe : describe.skip

const ABOUT = 'نبذة نشر اصطناعية 07c'
const NAME = 'ملف اصطناعي 07c'

async function countAudits(
  admin: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  entityId: string,
  action: string,
): Promise<number> {
  const { data } = await admin
    .from('audit_logs')
    .select('id')
    .eq('entity_id', entityId)
    .eq('action', action)
  return data?.length ?? 0
}

describeRls('Spec 07-C — publication disposable security matrix', () => {
  const admin = env ? createServiceRoleClient(env) : null

  let bizOwner: RlsRoleUser
  let uniOwner: RlsRoleUser
  let other: RlsRoleUser
  let staff: RlsRoleUser
  let superAdmin: RlsRoleUser
  let bizDir: DirectoryFixture
  let uniDir: DirectoryFixture
  let bizReady: BusinessProfileFixture
  let bizMissingName: BusinessProfileFixture
  let bizMissingAbout: BusinessProfileFixture
  let bizMissingBoth: BusinessProfileFixture
  let uniReady: UniversityProfileFixture
  let uniMissingName: UniversityProfileFixture
  let uniMissingAbout: UniversityProfileFixture
  let uniMissingBoth: UniversityProfileFixture
  let bizDir2: DirectoryFixture
  let uniDir2: DirectoryFixture
  let bizPublishedSeed: BusinessProfileFixture
  let uniPublishedSeed: UniversityProfileFixture
  let bizSuspendedSeed: BusinessProfileFixture
  let uniSuspendedSeed: UniversityProfileFixture

  beforeAll(async () => {
    if (!admin) return
    bizOwner = await createRlsUserWithRole(admin, '07c-biz-a', 'company_admin')
    uniOwner = await createRlsUserWithRole(admin, '07c-uni-b', 'university_admin')
    other = await createRlsUserWithRole(admin, '07c-other-c', 'company_admin')
    staff = await createRlsUserWithRole(admin, '07c-staff', 'staff')
    superAdmin = await createRlsUserWithRole(admin, '07c-sa', 'super_admin')

    bizDir = await createDirectoryCompany(admin, '07c-biz', 'business')
    uniDir = await createDirectoryCompany(admin, '07c-uni', 'university')
    bizDir2 = await createDirectoryCompany(admin, '07c-biz2', 'business')
    uniDir2 = await createDirectoryCompany(admin, '07c-uni2', 'university')

    bizReady = await createBusinessProfileFixture(admin, bizOwner.id, bizDir.id, '07c-ready')
    await admin.from('business_profiles').update({ display_name_ar: NAME, about_ar: ABOUT }).eq('id', bizReady.id)

    bizMissingName = await createBusinessProfileFixture(admin, bizOwner.id, bizDir2.id, '07c-mn')
    await admin
      .from('business_profiles')
      .update({ display_name_ar: '   ', about_ar: ABOUT })
      .eq('id', bizMissingName.id)

    // Separate directories for missing-about / both / published / suspended seeds
    const dAbout = await createDirectoryCompany(admin, '07c-ba', 'business')
    const dBoth = await createDirectoryCompany(admin, '07c-bb', 'business')
    const dPub = await createDirectoryCompany(admin, '07c-bp', 'business')
    const dSus = await createDirectoryCompany(admin, '07c-bs', 'business')
    ;(globalThis as { _07cExtraDirs?: string[] })._07cExtraDirs = [dAbout.id, dBoth.id, dPub.id, dSus.id]

    bizMissingAbout = await createBusinessProfileFixture(admin, bizOwner.id, dAbout.id, '07c-ma')
    await admin
      .from('business_profiles')
      .update({ display_name_ar: NAME, about_ar: '   ' })
      .eq('id', bizMissingAbout.id)

    bizMissingBoth = await createBusinessProfileFixture(admin, bizOwner.id, dBoth.id, '07c-mb')
    await admin
      .from('business_profiles')
      .update({ display_name_ar: '  ', about_ar: '  ' })
      .eq('id', bizMissingBoth.id)

    bizPublishedSeed = await createBusinessProfileFixture(admin, bizOwner.id, dPub.id, '07c-bp')
    await admin
      .from('business_profiles')
      .update({ display_name_ar: NAME, about_ar: ABOUT })
      .eq('id', bizPublishedSeed.id)
    const ownerClient = await createAuthenticatedClient(env!, bizOwner.email, bizOwner.password)
    await ownerClient.rpc('publish_business_profile', { p_profile_id: bizPublishedSeed.id })

    bizSuspendedSeed = await createBusinessProfileFixture(admin, bizOwner.id, dSus.id, '07c-bs')
    await admin
      .from('business_profiles')
      .update({ display_name_ar: NAME, about_ar: ABOUT })
      .eq('id', bizSuspendedSeed.id)
    const staffClient = await createAuthenticatedClient(env!, staff.email, staff.password)
    await staffClient.rpc('suspend_profile', {
      p_profile_id: bizSuspendedSeed.id,
      p_profile_type: 'business',
      p_reason: '07c fixture suspend',
    })

    uniReady = await createUniversityProfileFixture(admin, uniOwner.id, uniDir.id, '07c-uready')
    await admin.from('university_profiles').update({ display_name_ar: NAME, about_ar: ABOUT }).eq('id', uniReady.id)

    uniMissingName = await createUniversityProfileFixture(admin, uniOwner.id, uniDir2.id, '07c-umn')
    await admin
      .from('university_profiles')
      .update({ display_name_ar: '   ', about_ar: ABOUT })
      .eq('id', uniMissingName.id)

    const udAbout = await createDirectoryCompany(admin, '07c-ua', 'university')
    const udBoth = await createDirectoryCompany(admin, '07c-ub', 'university')
    const udPub = await createDirectoryCompany(admin, '07c-up', 'university')
    const udSus = await createDirectoryCompany(admin, '07c-us', 'university')
    ;(globalThis as { _07cExtraDirs?: string[] })._07cExtraDirs!.push(
      udAbout.id,
      udBoth.id,
      udPub.id,
      udSus.id,
    )

    uniMissingAbout = await createUniversityProfileFixture(admin, uniOwner.id, udAbout.id, '07c-uma')
    await admin
      .from('university_profiles')
      .update({ display_name_ar: NAME, about_ar: '  ' })
      .eq('id', uniMissingAbout.id)

    uniMissingBoth = await createUniversityProfileFixture(admin, uniOwner.id, udBoth.id, '07c-umb')
    await admin
      .from('university_profiles')
      .update({ display_name_ar: ' ', about_ar: ' ' })
      .eq('id', uniMissingBoth.id)

    uniPublishedSeed = await createUniversityProfileFixture(admin, uniOwner.id, udPub.id, '07c-up')
    await admin
      .from('university_profiles')
      .update({ display_name_ar: NAME, about_ar: ABOUT })
      .eq('id', uniPublishedSeed.id)
    const uniClient = await createAuthenticatedClient(env!, uniOwner.email, uniOwner.password)
    await uniClient.rpc('publish_university_profile', { p_profile_id: uniPublishedSeed.id })

    uniSuspendedSeed = await createUniversityProfileFixture(admin, uniOwner.id, udSus.id, '07c-us')
    await admin
      .from('university_profiles')
      .update({ display_name_ar: NAME, about_ar: ABOUT })
      .eq('id', uniSuspendedSeed.id)
    await staffClient.rpc('suspend_profile', {
      p_profile_id: uniSuspendedSeed.id,
      p_profile_type: 'university',
      p_reason: '07c uni fixture suspend',
    })
  }, 180_000)

  afterAll(async () => {
    if (!admin) return
    const profilesBiz = [
      bizReady,
      bizMissingName,
      bizMissingAbout,
      bizMissingBoth,
      bizPublishedSeed,
      bizSuspendedSeed,
    ]
    const profilesUni = [
      uniReady,
      uniMissingName,
      uniMissingAbout,
      uniMissingBoth,
      uniPublishedSeed,
      uniSuspendedSeed,
    ]
    for (const p of profilesBiz) {
      if (p?.id) await deleteBusinessProfile(admin, p.id).catch(() => undefined)
    }
    for (const p of profilesUni) {
      if (p?.id) await deleteUniversityProfile(admin, p.id).catch(() => undefined)
    }
    const dirs = [
      bizDir,
      uniDir,
      bizDir2,
      uniDir2,
      ...(((globalThis as { _07cExtraDirs?: string[] })._07cExtraDirs ?? []).map((id) => ({ id }))),
    ]
    for (const d of dirs) {
      if (d?.id) await deleteDirectoryCompany(admin, d.id).catch(() => undefined)
    }
    for (const u of [superAdmin, staff, other, uniOwner, bizOwner]) {
      if (u?.id) await deleteRlsUser(admin, u.id).catch(() => undefined)
    }
  }, 120_000)

  it('POSITIVE publish Business: status, published_at, audit, public read, no Directory/owner mutation', async () => {
    const { data: dirBefore } = await admin!
      .from('companies')
      .select('id,name,is_verified,claimed_by')
      .eq('id', bizDir.id)
      .single()
    const { data: before } = await admin!
      .from('business_profiles')
      .select('owner_user_id,status,published_at')
      .eq('id', bizReady.id)
      .single()
    expect(before).toMatchObject({ owner_user_id: bizOwner.id, status: 'draft', published_at: null })
    const auditsBefore = await countAudits(admin!, bizReady.id, 'profile.published')

    const owner = await createAuthenticatedClient(env!, bizOwner.email, bizOwner.password)
    // Optional fields absent — still publishes
    await admin!
      .from('business_profiles')
      .update({
        display_name_en: null,
        about_en: null,
        tagline_ar: null,
        cover_image_url: null,
        founded_year: null,
        employee_count_range: null,
      })
      .eq('id', bizReady.id)

    const { data, error } = await owner.rpc('publish_business_profile', { p_profile_id: bizReady.id })
    expect(error).toBeNull()
    expect(data).toMatchObject({ id: bizReady.id, status: 'published' })
    expect((data as { published_at: string | null }).published_at).toBeTruthy()
    expect(Object.keys(data as object).sort()).toEqual(['id', 'published_at', 'status'])

    const { data: after } = await admin!
      .from('business_profiles')
      .select('owner_user_id,status,published_at')
      .eq('id', bizReady.id)
      .single()
    expect(after).toMatchObject({ owner_user_id: bizOwner.id, status: 'published' })
    expect(after?.published_at).toBeTruthy()
    expect(await countAudits(admin!, bizReady.id, 'profile.published')).toBe(auditsBefore + 1)

    const { data: dirAfter } = await admin!
      .from('companies')
      .select('id,name,is_verified,claimed_by')
      .eq('id', bizDir.id)
      .single()
    expect(dirAfter).toEqual(dirBefore)

    const anon = createAnonClient(env!)
    const { data: pub } = await anon
      .from('business_profiles')
      .select('id,status,display_name_ar,about_ar')
      .eq('id', bizReady.id)
      .maybeSingle()
    expect(pub).toMatchObject({ id: bizReady.id, status: 'published' })
  })

  it('POSITIVE publish University: equivalent semantics + public read', async () => {
    const auditsBefore = await countAudits(admin!, uniReady.id, 'profile.published')
    const owner = await createAuthenticatedClient(env!, uniOwner.email, uniOwner.password)
    await admin!
      .from('university_profiles')
      .update({ display_name_en: null, about_en: null, cover_image_url: null, established_year: null })
      .eq('id', uniReady.id)
    const { data, error } = await owner.rpc('publish_university_profile', { p_profile_id: uniReady.id })
    expect(error).toBeNull()
    expect(data).toMatchObject({ id: uniReady.id, status: 'published' })
    expect(await countAudits(admin!, uniReady.id, 'profile.published')).toBe(auditsBefore + 1)
    const anon = createAnonClient(env!)
    const { data: pub } = await anon
      .from('university_profiles')
      .select('id,status')
      .eq('id', uniReady.id)
      .maybeSingle()
    expect(pub?.id).toBe(uniReady.id)
  })

  it('POSITIVE unpublish Business + University: draft, clear published_at, audit, public hide', async () => {
    const owner = await createAuthenticatedClient(env!, bizOwner.email, bizOwner.password)
    const auditsBefore = await countAudits(admin!, bizReady.id, 'profile.unpublished')
    const { data, error } = await owner.rpc('unpublish_business_profile', { p_profile_id: bizReady.id })
    expect(error).toBeNull()
    expect(data).toMatchObject({ status: 'draft', published_at: null })
    const { data: row } = await admin!
      .from('business_profiles')
      .select('status,published_at,owner_user_id')
      .eq('id', bizReady.id)
      .single()
    expect(row).toMatchObject({ status: 'draft', published_at: null, owner_user_id: bizOwner.id })
    expect(await countAudits(admin!, bizReady.id, 'profile.unpublished')).toBe(auditsBefore + 1)
    const anon = createAnonClient(env!)
    expect(
      (await anon.from('business_profiles').select('id').eq('id', bizReady.id).maybeSingle()).data,
    ).toBeNull()

    const uni = await createAuthenticatedClient(env!, uniOwner.email, uniOwner.password)
    const uAudits = await countAudits(admin!, uniReady.id, 'profile.unpublished')
    const { error: uErr } = await uni.rpc('unpublish_university_profile', { p_profile_id: uniReady.id })
    expect(uErr).toBeNull()
    expect(await countAudits(admin!, uniReady.id, 'profile.unpublished')).toBe(uAudits + 1)
    expect(
      (await anon.from('university_profiles').select('id').eq('id', uniReady.id).maybeSingle()).data,
    ).toBeNull()
  })

  it('MINIMUM FIELD failures Business + University; no success audit', async () => {
    const owner = await createAuthenticatedClient(env!, bizOwner.email, bizOwner.password)
    for (const [profileId, expectMsg] of [
      [bizMissingName.id, /missing_required_fields:display_name_ar$/],
      [bizMissingAbout.id, /missing_required_fields:about_ar$/],
      [bizMissingBoth.id, /missing_required_fields:display_name_ar,about_ar$/],
    ] as const) {
      const before = await countAudits(admin!, profileId, 'profile.published')
      const { error } = await owner.rpc('publish_business_profile', { p_profile_id: profileId })
      expect(error?.message ?? '').toMatch(expectMsg)
      const { data: row } = await admin!
        .from('business_profiles')
        .select('status,published_at')
        .eq('id', profileId)
        .single()
      expect(row).toMatchObject({ status: 'draft', published_at: null })
      expect(await countAudits(admin!, profileId, 'profile.published')).toBe(before)
    }

    const uni = await createAuthenticatedClient(env!, uniOwner.email, uniOwner.password)
    for (const [profileId, expectMsg] of [
      [uniMissingName.id, /missing_required_fields:display_name_ar$/],
      [uniMissingAbout.id, /missing_required_fields:about_ar$/],
      [uniMissingBoth.id, /missing_required_fields:display_name_ar,about_ar$/],
    ] as const) {
      const before = await countAudits(admin!, profileId, 'profile.published')
      const { error } = await uni.rpc('publish_university_profile', { p_profile_id: profileId })
      expect(error?.message ?? '').toMatch(expectMsg)
      expect(await countAudits(admin!, profileId, 'profile.published')).toBe(before)
    }
  })

  it('RPC authorization: anon, non-owner, cross-owner, cross-type; no forged audit', async () => {
    const anon = createAnonClient(env!)
    expect(
      (await anon.rpc('publish_business_profile', { p_profile_id: bizReady.id })).error,
    ).not.toBeNull()
    expect(
      (await anon.rpc('unpublish_university_profile', { p_profile_id: uniPublishedSeed.id })).error,
    ).not.toBeNull()

    const nonOwner = await createAuthenticatedClient(env!, other.email, other.password)
    const auditsBefore = await countAudits(admin!, bizReady.id, 'profile.published')
    expect(
      (await nonOwner.rpc('publish_business_profile', { p_profile_id: bizReady.id })).error?.message ??
        '',
    ).toMatch(/not_profile_owner/)
    expect(
      (await nonOwner.rpc('unpublish_business_profile', { p_profile_id: bizPublishedSeed.id })).error
        ?.message ?? '',
    ).toMatch(/not_profile_owner/)
    expect(await countAudits(admin!, bizReady.id, 'profile.published')).toBe(auditsBefore)

    const biz = await createAuthenticatedClient(env!, bizOwner.email, bizOwner.password)
    expect(
      (await biz.rpc('publish_business_profile', { p_profile_id: uniReady.id })).error?.message ?? '',
    ).toMatch(/profile_not_found|not_profile_owner/)
    const uni = await createAuthenticatedClient(env!, uniOwner.email, uniOwner.password)
    expect(
      (await uni.rpc('publish_university_profile', { p_profile_id: bizReady.id })).error?.message ??
        '',
    ).toMatch(/profile_not_found|not_profile_owner/)
  })

  it('Direct status-write prevention; content edit still works', async () => {
    const owner = await createAuthenticatedClient(env!, bizOwner.email, bizOwner.password)
    // ensure draft for content edit
    await admin!
      .from('business_profiles')
      .update({ display_name_ar: NAME, about_ar: ABOUT, status: 'draft', published_at: null })
      .eq('id', bizReady.id)

    expect(
      (await owner.from('business_profiles').update({ status: 'published' }).eq('id', bizReady.id))
        .error?.message ?? '',
    ).toMatch(/profile_moderation_fields_require_staff/)
    expect(
      (await owner.from('business_profiles').update({ status: 'suspended' }).eq('id', bizReady.id))
        .error?.message ?? '',
    ).toMatch(/profile_moderation_fields_require_staff/)

    const { data: content, error: contentErr } = await owner
      .from('business_profiles')
      .update({ about_en: '07c content edit' })
      .eq('id', bizReady.id)
      .select('about_en,status')
      .single()
    expect(contentErr).toBeNull()
    expect(content).toMatchObject({ about_en: '07c content edit', status: 'draft' })

    const nonOwner = await createAuthenticatedClient(env!, other.email, other.password)
    const { data: denied } = await nonOwner
      .from('business_profiles')
      .update({ about_en: 'hack' })
      .eq('id', bizReady.id)
      .select('id')
    expect(denied ?? []).toHaveLength(0)

    const anon = createAnonClient(env!)
    const { data: anonDenied } = await anon
      .from('business_profiles')
      .update({ about_en: 'anon' })
      .eq('id', bizReady.id)
      .select('id')
    expect(anonDenied ?? []).toHaveLength(0)

    // published → draft direct denied
    expect(
      (
        await owner
          .from('business_profiles')
          .update({ status: 'draft' })
          .eq('id', bizPublishedSeed.id)
      ).error?.message ?? '',
    ).toMatch(/profile_moderation_fields_require_staff/)

    // Suspended: owner UPDATE policy excludes suspended rows (RLS silent deny)
    // and/or trigger raises if a privileged path reached the row.
    const suspendedAttempt = await owner
      .from('business_profiles')
      .update({ status: 'draft' })
      .eq('id', bizSuspendedSeed.id)
      .select('id,status')
    const suspendedMsg = suspendedAttempt.error?.message ?? ''
    const suspendedDeniedByRls =
      !suspendedAttempt.error && (suspendedAttempt.data ?? []).length === 0
    const suspendedDeniedByTrigger =
      /suspended_profile_requires_staff_reinstatement|profile_moderation_fields_require_staff/.test(
        suspendedMsg,
      )
    expect(suspendedDeniedByRls || suspendedDeniedByTrigger).toBe(true)
    const { data: stillSuspended } = await admin!
      .from('business_profiles')
      .select('status')
      .eq('id', bizSuspendedSeed.id)
      .single()
    expect(stillSuspended?.status).toBe('suspended')
  })

  it('Public SELECT RLS: anon/non-owner/owner/staff matrices', async () => {
    const anon = createAnonClient(env!)
    expect(
      (await anon.from('business_profiles').select('id').eq('id', bizPublishedSeed.id).maybeSingle())
        .data?.id,
    ).toBe(bizPublishedSeed.id)
    expect(
      (await anon.from('business_profiles').select('id').eq('id', bizReady.id).maybeSingle()).data,
    ).toBeNull()
    expect(
      (
        await anon
          .from('business_profiles')
          .select('id')
          .eq('id', bizSuspendedSeed.id)
          .maybeSingle()
      ).data,
    ).toBeNull()
    expect(
      (
        await anon
          .from('university_profiles')
          .select('id')
          .eq('id', uniPublishedSeed.id)
          .maybeSingle()
      ).data?.id,
    ).toBe(uniPublishedSeed.id)
    expect(
      (
        await anon
          .from('university_profiles')
          .select('id')
          .eq('id', uniSuspendedSeed.id)
          .maybeSingle()
      ).data,
    ).toBeNull()

    const nonOwner = await createAuthenticatedClient(env!, other.email, other.password)
    expect(
      (
        await nonOwner
          .from('business_profiles')
          .select('id')
          .eq('id', bizPublishedSeed.id)
          .maybeSingle()
      ).data?.id,
    ).toBe(bizPublishedSeed.id)
    expect(
      (await nonOwner.from('business_profiles').select('id').eq('id', bizReady.id).maybeSingle())
        .data,
    ).toBeNull()
    expect(
      (
        await nonOwner
          .from('business_profiles')
          .select('id')
          .eq('id', bizSuspendedSeed.id)
          .maybeSingle()
      ).data,
    ).toBeNull()

    const owner = await createAuthenticatedClient(env!, bizOwner.email, bizOwner.password)
    expect(
      (await owner.from('business_profiles').select('status').eq('id', bizReady.id).maybeSingle())
        .data?.status,
    ).toBe('draft')
    expect(
      (
        await owner
          .from('business_profiles')
          .select('status')
          .eq('id', bizPublishedSeed.id)
          .maybeSingle()
      ).data?.status,
    ).toBe('published')
    expect(
      (
        await owner
          .from('business_profiles')
          .select('status')
          .eq('id', bizSuspendedSeed.id)
          .maybeSingle()
      ).data?.status,
    ).toBe('suspended')

    const staffClient = await createAuthenticatedClient(env!, staff.email, staff.password)
    expect(
      (
        await staffClient
          .from('business_profiles')
          .select('status')
          .eq('id', bizSuspendedSeed.id)
          .maybeSingle()
      ).data?.status,
    ).toBe('suspended')
  })

  it('Suspension precedence Business + University; owner cannot suspend/restore', async () => {
    const owner = await createAuthenticatedClient(env!, bizOwner.email, bizOwner.password)
    expect(
      (
        await owner.rpc('suspend_profile', {
          p_profile_id: bizReady.id,
          p_profile_type: 'business',
          p_reason: 'owner attempt',
        })
      ).error?.message ?? '',
    ).toMatch(/insufficient_privileges/)
    expect(
      (
        await owner.rpc('reinstate_profile', {
          p_profile_id: bizSuspendedSeed.id,
          p_profile_type: 'business',
          p_target_status: 'draft',
          p_reason: 'owner restore',
        })
      ).error?.message ?? '',
    ).toMatch(/insufficient_privileges/)

    expect(
      (await owner.rpc('publish_business_profile', { p_profile_id: bizSuspendedSeed.id })).error
        ?.message ?? '',
    ).toMatch(/profile_suspended/)
    expect(
      (await owner.rpc('unpublish_business_profile', { p_profile_id: bizSuspendedSeed.id })).error
        ?.message ?? '',
    ).toMatch(/profile_suspended/)

    const uni = await createAuthenticatedClient(env!, uniOwner.email, uniOwner.password)
    expect(
      (await uni.rpc('publish_university_profile', { p_profile_id: uniSuspendedSeed.id })).error
        ?.message ?? '',
    ).toMatch(/profile_suspended/)
    expect(
      (await uni.rpc('unpublish_university_profile', { p_profile_id: uniSuspendedSeed.id })).error
        ?.message ?? '',
    ).toMatch(/profile_suspended/)

    // Directory published lookup: suspended yields no published row
    const anon = createAnonClient(env!)
    const { data: suspendedLink } = await anon
      .from('business_profiles')
      .select('id')
      .eq('directory_id', bizSuspendedSeed.directoryId)
      .eq('status', 'published')
    expect(suspendedLink ?? []).toHaveLength(0)

    // Super Admin can reinstate (existing mechanism)
    const sa = await createAuthenticatedClient(env!, superAdmin.email, superAdmin.password)
    const { error: reinstateErr } = await sa.rpc('reinstate_profile', {
      p_profile_id: uniSuspendedSeed.id,
      p_profile_type: 'university',
      p_target_status: 'draft',
      p_reason: '07c sa reinstate check',
    })
    expect(reinstateErr).toBeNull()
    // re-suspend for cleanup consistency of later assertions
    await sa.rpc('suspend_profile', {
      p_profile_id: uniSuspendedSeed.id,
      p_profile_type: 'university',
      p_reason: '07c re-suspend after sa check',
    })
  })

  it('Directory lookup: published link vs draft/suspended/absent; ids distinct', async () => {
    const anon = createAnonClient(env!)
    const { data: pub } = await anon
      .from('business_profiles')
      .select('id,directory_id,status')
      .eq('directory_id', bizPublishedSeed.directoryId)
      .eq('status', 'published')
    expect(pub).toHaveLength(1)
    expect(pub?.[0]?.id).not.toBe(pub?.[0]?.directory_id)

    const { data: draft } = await anon
      .from('business_profiles')
      .select('id')
      .eq('directory_id', bizReady.directoryId)
      .eq('status', 'published')
    expect(draft ?? []).toHaveLength(0)

    const absentDir = await createDirectoryCompany(admin!, '07c-absent', 'business')
    const { data: absent } = await anon
      .from('business_profiles')
      .select('id')
      .eq('directory_id', absentDir.id)
      .eq('status', 'published')
    expect(absent ?? []).toHaveLength(0)
    await deleteDirectoryCompany(admin!, absentDir.id)

    const { data: uniPub } = await anon
      .from('university_profiles')
      .select('id,directory_id')
      .eq('directory_id', uniPublishedSeed.directoryId)
      .eq('status', 'published')
    expect(uniPub?.[0]?.id).not.toBe(uniPub?.[0]?.directory_id)
  })

  it('Atomicity / repeated operations: republish and draft-unpublish fail honestly', async () => {
    const owner = await createAuthenticatedClient(env!, bizOwner.email, bizOwner.password)
    const audits = await countAudits(admin!, bizPublishedSeed.id, 'profile.published')
    const { error: again } = await owner.rpc('publish_business_profile', {
      p_profile_id: bizPublishedSeed.id,
    })
    expect(again?.message ?? '').toMatch(/profile_already_published/)
    expect(await countAudits(admin!, bizPublishedSeed.id, 'profile.published')).toBe(audits)

    const { error: draftUnpub } = await owner.rpc('unpublish_business_profile', {
      p_profile_id: bizReady.id,
    })
    expect(draftUnpub?.message ?? '').toMatch(/profile_not_published/)

    // failed publish leaves state
    const { data: row } = await admin!
      .from('business_profiles')
      .select('status,published_at')
      .eq('id', bizMissingAbout.id)
      .single()
    expect(row).toMatchObject({ status: 'draft', published_at: null })
  })

  it('Ordinary clients cannot forge publication audit rows', async () => {
    const owner = await createAuthenticatedClient(env!, bizOwner.email, bizOwner.password)
    const { error } = await owner.from('audit_logs').insert({
      actor_id: bizOwner.id,
      action: 'profile.published',
      entity_type: 'business_profile',
      entity_id: bizReady.id,
      new_data: { forged: true },
    })
    expect(error).not.toBeNull()
  })
})
