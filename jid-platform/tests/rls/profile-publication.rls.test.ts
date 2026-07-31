// @vitest-environment node
/**
 * Spec 07-B — live publication RPC + public RLS matrix (skips without disposable env).
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

describeRls('Spec 07-B — profile publication RPCs and public RLS', () => {
  const admin = env ? createServiceRoleClient(env) : null

  let businessOwner: RlsRoleUser
  let businessOther: RlsRoleUser
  let universityOwner: RlsRoleUser
  let universityOther: RlsRoleUser
  let staff: RlsRoleUser
  let businessDirectory: DirectoryFixture
  let universityDirectory: DirectoryFixture
  let businessProfile: BusinessProfileFixture
  let universityProfile: UniversityProfileFixture

  beforeAll(async () => {
    if (!admin) return
    businessOwner = await createRlsUserWithRole(admin, 'pub-biz-owner', 'company_admin')
    businessOther = await createRlsUserWithRole(admin, 'pub-biz-other', 'company_admin')
    universityOwner = await createRlsUserWithRole(admin, 'pub-uni-owner', 'university_admin')
    universityOther = await createRlsUserWithRole(admin, 'pub-uni-other', 'university_admin')
    staff = await createRlsUserWithRole(admin, 'pub-staff', 'staff')

    businessDirectory = await createDirectoryCompany(admin, 'pub-biz')
    universityDirectory = await createDirectoryCompany(admin, 'pub-uni', 'university')

    businessProfile = await createBusinessProfileFixture(
      admin,
      businessOwner.id,
      businessDirectory.id,
      'pub-biz',
    )
    universityProfile = await createUniversityProfileFixture(
      admin,
      universityOwner.id,
      universityDirectory.id,
      'pub-uni',
    )

    await admin
      .from('business_profiles')
      .update({ about_ar: 'نبذة الشركة للنشر' })
      .eq('id', businessProfile.id)
    await admin
      .from('university_profiles')
      .update({ about_ar: 'نبذة الجامعة للنشر' })
      .eq('id', universityProfile.id)
  })

  afterAll(async () => {
    if (!admin) return
    if (businessProfile?.id) await deleteBusinessProfile(admin, businessProfile.id)
    if (universityProfile?.id) await deleteUniversityProfile(admin, universityProfile.id)
    for (const directory of [businessDirectory, universityDirectory]) {
      if (directory?.id) await deleteDirectoryCompany(admin, directory.id)
    }
    for (const user of [staff, universityOther, universityOwner, businessOther, businessOwner]) {
      if (user?.id) await deleteRlsUser(admin, user.id)
    }
  })

  it('owner publishes own draft Business Profile with audit', async () => {
    const client = await createAuthenticatedClient(env!, businessOwner.email, businessOwner.password)
    const { data, error } = await client.rpc('publish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(error).toBeNull()
    expect(data).toMatchObject({ id: businessProfile.id, status: 'published' })
    expect((data as { published_at: string | null }).published_at).toBeTruthy()

    const { data: row } = await admin!
      .from('business_profiles')
      .select('status, published_at')
      .eq('id', businessProfile.id)
      .single()
    expect(row).toMatchObject({ status: 'published' })
    expect(row?.published_at).toBeTruthy()

    const { data: audits } = await admin!
      .from('audit_logs')
      .select('action')
      .eq('entity_id', businessProfile.id)
      .eq('action', 'profile.published')
    expect(audits?.length).toBeGreaterThanOrEqual(1)
  })

  it('owner publishes own draft University Profile with audit', async () => {
    const client = await createAuthenticatedClient(
      env!,
      universityOwner.email,
      universityOwner.password,
    )
    const { data, error } = await client.rpc('publish_university_profile', {
      p_profile_id: universityProfile.id,
    })
    expect(error).toBeNull()
    expect(data).toMatchObject({ id: universityProfile.id, status: 'published' })

    const { data: audits } = await admin!
      .from('audit_logs')
      .select('action')
      .eq('entity_id', universityProfile.id)
      .eq('action', 'profile.published')
    expect(audits?.length).toBeGreaterThanOrEqual(1)
  })

  it('rejects republish and allows content updates while published', async () => {
    const client = await createAuthenticatedClient(env!, businessOwner.email, businessOwner.password)
    const { error: again } = await client.rpc('publish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(again?.message ?? '').toMatch(/profile_already_published/)

    const { data, error } = await client
      .from('business_profiles')
      .update({ about_en: 'Published content edit' })
      .eq('id', businessProfile.id)
      .select('about_en')
      .single()
    expect(error).toBeNull()
    expect(data?.about_en).toBe('Published content edit')
  })

  it('owner cannot set status directly; another user cannot publish/unpublish', async () => {
    const owner = await createAuthenticatedClient(env!, businessOwner.email, businessOwner.password)
    const { error: direct } = await owner
      .from('business_profiles')
      .update({ status: 'draft' })
      .eq('id', businessProfile.id)
    expect(direct?.message ?? '').toMatch(/profile_moderation_fields_require_staff/)

    const other = await createAuthenticatedClient(env!, businessOther.email, businessOther.password)
    const { error: pub } = await other.rpc('publish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(pub?.message ?? '').toMatch(/not_profile_owner|profile_already_published/)

    const { error: unpub } = await other.rpc('unpublish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(unpub?.message ?? '').toMatch(/not_profile_owner/)
  })

  it('anon cannot execute publication RPCs', async () => {
    const anon = createAnonClient(env!)
    const { error } = await anon.rpc('publish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(error).not.toBeNull()
  })

  it('public SELECT allows published and denies draft/suspended for anon and non-owner', async () => {
    const anon = createAnonClient(env!)
    const { data: publishedBiz } = await anon
      .from('business_profiles')
      .select('id, status, owner_user_id')
      .eq('id', businessProfile.id)
      .maybeSingle()
    expect(publishedBiz?.id).toBe(businessProfile.id)
    expect(publishedBiz?.status).toBe('published')

    const { data: publishedUni } = await anon
      .from('university_profiles')
      .select('id, status')
      .eq('id', universityProfile.id)
      .maybeSingle()
    expect(publishedUni?.id).toBe(universityProfile.id)

    const owner = await createAuthenticatedClient(env!, businessOwner.email, businessOwner.password)
    await owner.rpc('unpublish_business_profile', { p_profile_id: businessProfile.id })

    const { data: draftAnon } = await anon
      .from('business_profiles')
      .select('id')
      .eq('id', businessProfile.id)
      .maybeSingle()
    expect(draftAnon).toBeNull()

    const nonOwner = await createAuthenticatedClient(env!, businessOther.email, businessOther.password)
    const { data: draftOther } = await nonOwner
      .from('business_profiles')
      .select('id')
      .eq('id', businessProfile.id)
      .maybeSingle()
    expect(draftOther).toBeNull()

    const { data: ownerDraft } = await owner
      .from('business_profiles')
      .select('id, status')
      .eq('id', businessProfile.id)
      .maybeSingle()
    expect(ownerDraft).toMatchObject({ id: businessProfile.id, status: 'draft' })

    // Restore published for later cases
    await admin!
      .from('business_profiles')
      .update({ about_ar: 'نبذة الشركة للنشر' })
      .eq('id', businessProfile.id)
    const { error: republish } = await owner.rpc('publish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(republish).toBeNull()
  })

  it('minimum-field failures are independent for blank display_name_ar / about_ar', async () => {
    const owner = await createAuthenticatedClient(env!, businessOwner.email, businessOwner.password)
    await owner.rpc('unpublish_business_profile', { p_profile_id: businessProfile.id })

    await admin!.from('business_profiles').update({ about_ar: '   ' }).eq('id', businessProfile.id)
    const { error: missingAbout } = await owner.rpc('publish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(missingAbout?.message ?? '').toMatch(/missing_required_fields:about_ar/)

    await admin!
      .from('business_profiles')
      .update({ display_name_ar: '   ', about_ar: 'نبذة' })
      .eq('id', businessProfile.id)
    const { error: missingName } = await owner.rpc('publish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(missingName?.message ?? '').toMatch(/missing_required_fields:display_name_ar/)

    await admin!
      .from('business_profiles')
      .update({ display_name_ar: '   ', about_ar: '  ' })
      .eq('id', businessProfile.id)
    const { error: missingBoth } = await owner.rpc('publish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(missingBoth?.message ?? '').toMatch(
      /missing_required_fields:display_name_ar,about_ar/,
    )

    await admin!
      .from('business_profiles')
      .update({ display_name_ar: 'ملف pub-biz', about_ar: 'نبذة الشركة للنشر' })
      .eq('id', businessProfile.id)
    const { error: ok } = await owner.rpc('publish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(ok).toBeNull()
  })

  it('unpublish clears published_at and writes audit; draft cannot unpublish', async () => {
    const owner = await createAuthenticatedClient(env!, businessOwner.email, businessOwner.password)
    const { data, error } = await owner.rpc('unpublish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(error).toBeNull()
    expect(data).toMatchObject({ status: 'draft', published_at: null })

    const { data: row } = await admin!
      .from('business_profiles')
      .select('status, published_at')
      .eq('id', businessProfile.id)
      .single()
    expect(row).toMatchObject({ status: 'draft', published_at: null })

    const { data: audits } = await admin!
      .from('audit_logs')
      .select('action')
      .eq('entity_id', businessProfile.id)
      .eq('action', 'profile.unpublished')
    expect(audits?.length).toBeGreaterThanOrEqual(1)

    const { error: again } = await owner.rpc('unpublish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(again?.message ?? '').toMatch(/profile_not_published/)
  })

  it('suspended Profile cannot publish or unpublish; public cannot see it; owner can still read', async () => {
    const staffClient = await createAuthenticatedClient(env!, staff.email, staff.password)
    await admin!
      .from('business_profiles')
      .update({ display_name_ar: 'ملف pub-biz', about_ar: 'نبذة الشركة للنشر', status: 'draft' })
      .eq('id', businessProfile.id)

    const { error: suspendErr } = await staffClient.rpc('suspend_profile', {
      p_profile_id: businessProfile.id,
      p_profile_type: 'business',
      p_reason: 'Spec 07-B suspension precedence',
    })
    expect(suspendErr).toBeNull()

    const owner = await createAuthenticatedClient(env!, businessOwner.email, businessOwner.password)
    const { error: pub } = await owner.rpc('publish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(pub?.message ?? '').toMatch(/profile_suspended/)

    const { error: unpub } = await owner.rpc('unpublish_business_profile', {
      p_profile_id: businessProfile.id,
    })
    expect(unpub?.message ?? '').toMatch(/profile_suspended/)

    const anon = createAnonClient(env!)
    const { data: hidden } = await anon
      .from('business_profiles')
      .select('id')
      .eq('id', businessProfile.id)
      .maybeSingle()
    expect(hidden).toBeNull()

    const { data: ownerRow } = await owner
      .from('business_profiles')
      .select('id, status')
      .eq('id', businessProfile.id)
      .maybeSingle()
    expect(ownerRow).toMatchObject({ id: businessProfile.id, status: 'suspended' })

    const { error: reinstate } = await staffClient.rpc('reinstate_profile', {
      p_profile_id: businessProfile.id,
      p_profile_type: 'business',
      p_target_status: 'draft',
      p_reason: 'Spec 07-B cleanup',
    })
    expect(reinstate).toBeNull()
  })

  it('Directory lookup foundation: published yields link target; draft yields none', async () => {
    const owner = await createAuthenticatedClient(env!, businessOwner.email, businessOwner.password)
    await admin!
      .from('business_profiles')
      .update({ display_name_ar: 'ملف pub-biz', about_ar: 'نبذة الشركة للنشر' })
      .eq('id', businessProfile.id)
    await owner.rpc('publish_business_profile', { p_profile_id: businessProfile.id })

    const { data: directory } = await admin!
      .from('companies')
      .select('id, slug')
      .eq('id', businessDirectory.id)
      .single()
    expect(directory?.slug).toBeTruthy()
    expect(directory?.id).not.toBe(businessProfile.id)

    const anon = createAnonClient(env!)
    const { data: published } = await anon
      .from('business_profiles')
      .select('id, directory_id, status')
      .eq('directory_id', businessDirectory.id)
      .eq('status', 'published')
    expect(published).toHaveLength(1)
    expect(published?.[0]?.id).toBe(businessProfile.id)
    expect(published?.[0]?.directory_id).toBe(businessDirectory.id)

    await owner.rpc('unpublish_business_profile', { p_profile_id: businessProfile.id })
    const { data: draft } = await anon
      .from('business_profiles')
      .select('id')
      .eq('directory_id', businessDirectory.id)
      .eq('status', 'published')
    expect(draft ?? []).toHaveLength(0)

    const uniOwner = await createAuthenticatedClient(
      env!,
      universityOwner.email,
      universityOwner.password,
    )
    const { data: uniPublished } = await anon
      .from('university_profiles')
      .select('id, directory_id')
      .eq('directory_id', universityDirectory.id)
      .eq('status', 'published')
    expect(uniPublished?.[0]?.id).toBe(universityProfile.id)
    expect(uniPublished?.[0]?.directory_id).not.toBe(uniPublished?.[0]?.id)

    // keep university published for soft assert; unpublish cleanup optional
    await uniOwner.rpc('unpublish_university_profile', { p_profile_id: universityProfile.id })
  })
})
