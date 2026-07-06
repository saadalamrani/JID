import 'server-only'

import { validateDomainMatch } from '@/lib/jobs/domain-validator'
import type { JobPostingInput } from '@/lib/validations/job-posting'
import type { ApprovedCompanyPoster } from '@/lib/jobs/poster-types'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

async function resolveSectorId(client: Client, slug: string): Promise<string | null> {
  const { data } = await client.from('sectors').select('id').eq('slug', slug).maybeSingle()
  return data?.id ?? null
}

async function resolveRegionId(client: Client, slug: string): Promise<string | null> {
  const { data } = await client.from('regions').select('id').eq('slug', slug).maybeSingle()
  return data?.id ?? null
}

export type CreateCompanyJobResult = {
  jobId: string
  status: 'draft' | 'published' | 'pending_review'
}

export async function createCompanyJob(
  poster: ApprovedCompanyPoster,
  input: JobPostingInput,
): Promise<CreateCompanyJobResult> {
  const domainCheck = validateDomainMatch(input.external_apply_url, poster.company.domains, 'ar')
  if (!domainCheck.valid) {
    throw new Error(domainCheck.message)
  }

  const supabase = await createClient()
  const sectorId = await resolveSectorId(supabase, input.sector_slug)
  const regionId = await resolveRegionId(supabase, input.region_slug)

  if (!sectorId) throw new Error('القطاع المحدد غير صالح')
  if (!regionId) throw new Error('المنطقة المحددة غير صالحة')

  let status: 'draft' | 'published' | 'pending_review' = 'draft'
  let publishedAt: string | null = null

  if (input.publish) {
    if (poster.company.entity_state === 'approved') {
      status = 'published'
      publishedAt = new Date().toISOString()
    } else {
      status = 'pending_review'
    }
  }

  const deadlineIso = new Date(`${input.application_deadline}T20:59:59.000Z`).toISOString()

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      company_id: poster.company.id,
      title_ar: input.title_ar,
      title_en: input.title_en?.trim() || null,
      experience_level: input.experience_level,
      sector_id: sectorId,
      region_id: regionId,
      city: input.city.trim(),
      description_ar: input.description_ar,
      required_skills: input.required_skills,
      external_apply_url: input.external_apply_url.trim(),
      application_deadline: deadlineIso,
      status,
      published_at: publishedAt,
      created_by: poster.userId,
    })
    .select('id, status')
    .single()

  if (error) throw new Error(error.message)

  return {
    jobId: data.id,
    status: data.status as CreateCompanyJobResult['status'],
  }
}
