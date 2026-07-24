import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export type RlsRoleUser = {
  id: string
  email: string
  password: string
}

const TEST_PASSWORD = 'RlsTest1!pass'

export async function createRlsUserWithRole(
  admin: SupabaseClient,
  label: string,
  role: 'individual' | 'company_admin' | 'university_admin' | 'staff' | 'admin' | 'super_admin',
): Promise<RlsRoleUser> {
  const id = randomUUID()
  const email = `rls-${label}-${id}@jid.local.test`

  const { data, error } = await admin.auth.admin.createUser({
    id,
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  })

  if (error || !data.user) {
    throw new Error(`Failed to create RLS user (${label}): ${error?.message ?? 'no user'}`)
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: data.user.id,
    full_name: `RLS ${label}`,
    locale: 'ar',
    visibility: 'private',
    show_profile_to_companies: false,
    profile_state: 'active',
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id)
    throw new Error(`Failed to seed profile (${label}): ${profileError.message}`)
  }

  if (role !== 'individual') {
    const { error: roleError } = await admin.rpc('rls_test_set_user_role', {
      p_target_user_id: data.user.id,
      p_new_role: role,
    })

    if (roleError) {
      await admin.auth.admin.deleteUser(data.user.id)
      throw new Error(`Failed to assign fixture role (${label}): ${roleError.message}`)
    }
  }

  return { id: data.user.id, email, password: TEST_PASSWORD }
}

export async function deleteRlsUser(admin: SupabaseClient, userId: string): Promise<void> {
  const { error: auditError } = await admin.rpc('rls_test_clear_user_audit', { p_user_id: userId })
  if (auditError) {
    throw new Error(`Failed to clear local RLS audit fixtures (${userId}): ${auditError.message}`)
  }
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    throw new Error(`Failed to delete RLS user (${userId}): ${error.message}`)
  }
}

export type DirectoryFixture = {
  id: string
}

export type DirectoryCompanyFixture = DirectoryFixture & {
  name: string
  domain: string
  entityType: 'business' | 'university'
}

export async function createDirectoryCompany(
  admin: SupabaseClient,
  label: string,
  entityType: 'business' | 'university' = 'business',
): Promise<DirectoryCompanyFixture> {
  const id = randomUUID()
  const slug = `rls-dir-${label}-${id.slice(0, 8)}`
  const name = `RLS Directory ${label}`
  const domain = `${slug}.test`

  const { error } = await admin.from('companies').insert({
    id,
    name,
    name_ar: `دليل ${label}`,
    domains: [domain],
    entity_type: entityType,
    is_verified: true,
    is_active: true,
    slug,
  })

  if (error) {
    throw new Error(`Failed to seed directory company (${label}): ${error.message}`)
  }

  return { id, name, domain, entityType }
}

export async function deleteDirectoryCompany(admin: SupabaseClient, directoryId: string): Promise<void> {
  const { error } = await admin.from('companies').delete().eq('id', directoryId)
  if (error) {
    throw new Error(`Failed to delete directory (${directoryId}): ${error.message}`)
  }
}

export type BusinessProfileFixture = {
  id: string
  directoryId: string
}

export async function createBusinessProfileFixture(
  admin: SupabaseClient,
  ownerUserId: string,
  directoryId: string,
  label: string,
): Promise<BusinessProfileFixture> {
  const { data, error } = await admin
    .from('business_profiles')
    .insert({
      directory_id: directoryId,
      owner_user_id: ownerUserId,
      display_name_ar: `ملف ${label}`,
      display_name_en: `Profile ${label}`,
      status: 'draft',
      verified_domains: ['example.test'],
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to seed business profile (${label}): ${error?.message ?? 'no row'}`)
  }

  return { id: data.id, directoryId }
}

export async function deleteBusinessProfile(admin: SupabaseClient, profileId: string): Promise<void> {
  const { error } = await admin.from('business_profiles').delete().eq('id', profileId)
  if (error) {
    throw new Error(`Failed to delete business profile (${profileId}): ${error.message}`)
  }
}

export type UniversityProfileFixture = {
  id: string
  directoryId: string
}

export async function createUniversityProfileFixture(
  admin: SupabaseClient,
  ownerUserId: string,
  directoryId: string,
  label: string,
): Promise<UniversityProfileFixture> {
  const { data, error } = await admin
    .from('university_profiles')
    .insert({
      directory_id: directoryId,
      owner_user_id: ownerUserId,
      display_name_ar: `جامعة ${label}`,
      display_name_en: `University ${label}`,
      status: 'draft',
      verified_domains: ['university.example.test'],
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to seed university profile (${label}): ${error?.message ?? 'no row'}`)
  }

  return { id: data.id, directoryId }
}

export async function deleteUniversityProfile(admin: SupabaseClient, profileId: string): Promise<void> {
  const { error } = await admin.from('university_profiles').delete().eq('id', profileId)
  if (error) {
    throw new Error(`Failed to delete university profile (${profileId}): ${error.message}`)
  }
}

export type VerificationFixture = {
  id: string
}

export async function createVerificationRequestFixture(
  admin: SupabaseClient,
  applicantUserId: string,
  directoryId: string,
  label: string,
): Promise<VerificationFixture> {
  const { data, error } = await admin
    .from('verification_requests')
    .insert({
      applicant_user_id: applicantUserId,
      directory_id: directoryId,
      company_name: `RLS Co ${label}`,
      business_email: `verify-${label}@example.test`,
      claimant_name: `Claimant ${label}`,
      verification_type: 'business',
      status: 'pending_review',
      evidence_urls: [],
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to seed verification (${label}): ${error?.message ?? 'no row'}`)
  }

  return { id: data.id }
}

export async function deleteVerificationRequest(admin: SupabaseClient, verificationId: string): Promise<void> {
  const { error } = await admin.from('verification_requests').delete().eq('id', verificationId)
  if (error) {
    throw new Error(`Failed to delete verification (${verificationId}): ${error.message}`)
  }
}

export async function deleteCorrectionSuggestionsForDirectory(
  admin: SupabaseClient,
  directoryId: string,
): Promise<void> {
  const { error } = await admin
    .from('directory_correction_suggestions')
    .delete()
    .eq('directory_id', directoryId)
  if (error) {
    throw new Error(`Failed to delete correction suggestions: ${error.message}`)
  }
}
