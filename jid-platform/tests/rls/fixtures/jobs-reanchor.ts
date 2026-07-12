import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createBusinessProfileFixture,
  createDirectoryCompany,
  createRlsUserWithRole,
  deleteBusinessProfile,
  deleteDirectoryCompany,
  deleteRlsUser,
  type BusinessProfileFixture,
  type DirectoryFixture,
  type RlsRoleUser,
} from './ownership-law'

export type JobFixture = { id: string; companyId: string; businessProfileId: string | null }

const JOB_DEADLINE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

export async function createDirectoryWithOwner(
  admin: SupabaseClient,
  ownerUserId: string,
  label: string,
): Promise<DirectoryFixture> {
  const id = randomUUID()
  const slug = `rls-legacy-${label}-${id.slice(0, 8)}`

  const { error } = await admin.from('companies').insert({
    id,
    name: `RLS Legacy ${label}`,
    name_ar: `قديم ${label}`,
    domains: [`${slug}.test`],
    entity_type: 'business',
    is_verified: true,
    is_active: true,
    slug,
    claimed_by: ownerUserId,
    entity_state: 'approved',
  })

  if (error) {
    throw new Error(`Failed to seed legacy directory (${label}): ${error.message}`)
  }

  return { id }
}

export async function seedJobFixture(
  admin: SupabaseClient,
  input: {
    companyId: string
    businessProfileId?: string | null
    title?: string
  },
): Promise<JobFixture> {
  const { data, error } = await admin
    .from('jobs')
    .insert({
      company_id: input.companyId,
      business_profile_id: input.businessProfileId ?? null,
      title_ar: input.title ?? 'وظيفة اختبار',
      experience_level: 'entry',
      status: 'draft',
      application_deadline: JOB_DEADLINE,
      external_apply_url: 'https://careers.example.test/apply',
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to seed job: ${error?.message ?? 'no row'}`)
  }

  return {
    id: data.id,
    companyId: input.companyId,
    businessProfileId: input.businessProfileId ?? null,
  }
}

export async function deleteJobFixture(admin: SupabaseClient, jobId: string): Promise<void> {
  const { error } = await admin.from('jobs').delete().eq('id', jobId)
  if (error) {
    throw new Error(`Failed to delete job (${jobId}): ${error.message}`)
  }
}

export async function seedApplicationFixture(
  admin: SupabaseClient,
  input: { jobId: string; companyId: string; applicantUserId: string },
): Promise<string> {
  const { data, error } = await admin
    .from('applications')
    .insert({
      job_id: input.jobId,
      company_id: input.companyId,
      applicant_id: input.applicantUserId,
      status: 'submitted',
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to seed application: ${error?.message ?? 'no row'}`)
  }

  return data.id
}

export async function deleteApplicationFixture(
  admin: SupabaseClient,
  applicationId: string,
): Promise<void> {
  const { error } = await admin.from('applications').delete().eq('id', applicationId)
  if (error) {
    throw new Error(`Failed to delete application (${applicationId}): ${error.message}`)
  }
}

export {
  createBusinessProfileFixture,
  createDirectoryCompany,
  createRlsUserWithRole,
  deleteBusinessProfile,
  deleteDirectoryCompany,
  deleteRlsUser,
  type BusinessProfileFixture,
  type DirectoryFixture,
  type RlsRoleUser,
}
