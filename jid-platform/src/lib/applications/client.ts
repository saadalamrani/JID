'use client'

import { createClient } from '@/lib/supabase/client'
import type { UserApplicationsResult } from '@/types/application'

export function userApplicationsQueryKey(userId: string) {
  return ['applications', 'user', userId] as const
}

/** Client fetch for Radar — RLS limits to applicant_id = auth user. */
export async function fetchUserApplicationsClient(
  userId: string,
): Promise<UserApplicationsResult> {
  const supabase = createClient()
  const { data, error, count } = await supabase
    .from('applications')
    .select(
      `
      id,
      job_id,
      applicant_id,
      company_id,
      status,
      cover_letter,
      resume_url,
      contact_email,
      submitted_at,
      last_company_action_at,
      expires_at,
      created_at,
      updated_at,
      job:jobs(id, slug, title_ar, title_en, application_deadline),
      company:companies(id, slug, name, name_ar, logo_url)
    `,
      { count: 'exact' },
    )
    .eq('applicant_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)

  const applications = (data ?? []).map((row) => {
    const job = Array.isArray(row.job) ? row.job[0] : row.job
    const company = Array.isArray(row.company) ? row.company[0] : row.company
    return {
      ...row,
      job: job ?? null,
      company: company
        ? {
            id: company.id,
            slug: company.slug,
            name_en: company.name,
            name_ar: company.name_ar,
            logo_url: company.logo_url,
          }
        : null,
    }
  }) as UserApplicationsResult['applications']

  return {
    applications,
    count: count ?? applications.length,
  }
}
