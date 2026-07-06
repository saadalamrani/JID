import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>
type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: Client): UntypedClient {
  return client as unknown as UntypedClient
}

/**
 * Day 9 email queue — enqueue application rejection notifications.
 * Worker (pg_cron / edge function) drains email_outbox.template = 'application_rejection'.
 */
export async function queueApplicationRejectionEmails(
  client: Client,
  applicationIds: string[],
): Promise<number> {
  if (!applicationIds.length) return 0

  const { data: applications, error } = await client
    .from('applications')
    .select(
      `
      id,
      applicant_id,
      job_id,
      contact_email,
      job:jobs(title_ar, title_en),
      applicant:profiles!applications_applicant_id_fkey(full_name)
    `,
    )
    .in('id', applicationIds)

  if (error || !applications?.length) {
    console.error('queueApplicationRejectionEmails fetch failed:', error?.message)
    return 0
  }

  const rows = applications.map((row) => {
    const job = Array.isArray(row.job) ? row.job[0] : row.job
    const applicant = Array.isArray(row.applicant) ? row.applicant[0] : row.applicant
    return {
      template: 'application_rejection',
      payload: {
        application_id: row.id,
        applicant_id: row.applicant_id,
        job_id: row.job_id,
        contact_email: row.contact_email,
        applicant_name: applicant?.full_name ?? null,
        job_title_ar: job?.title_ar ?? null,
        job_title_en: job?.title_en ?? null,
      },
      status: 'pending',
    }
  })

  const { error: insertError } = await asUntyped(client).from('email_outbox').insert(rows)

  if (insertError) {
    console.error('queueApplicationRejectionEmails insert failed:', insertError.message)
    return 0
  }

  return rows.length
}
