import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import {
  EXPIRY_EMAIL_SUBJECT_AR,
  renderExpiryEmailHtml,
} from '../_shared/email-templates.ts'
import { sendResendEmail } from '../_shared/resend.ts'
import { createServiceClient } from '../_shared/supabase.ts'

type Body = {
  applicationId?: string
  outboxId?: string
}

async function resolveRecipientEmail(
  supabase: ReturnType<typeof createServiceClient>,
  applicantId: string,
  contactEmail: string | null,
): Promise<string | null> {
  if (contactEmail?.trim()) return contactEmail.trim()

  const { data: verified } = await supabase
    .from('user_verified_emails')
    .select('email')
    .eq('user_id', applicantId)
    .eq('is_primary', true)
    .maybeSingle()

  return verified?.email?.trim() ?? null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const body = (await req.json()) as Body
    const applicationId = body.applicationId?.trim()
    const outboxId = body.outboxId?.trim()

    if (!applicationId && !outboxId) {
      return jsonResponse({ error: 'applicationId or outboxId required' }, 400)
    }

    const supabase = createServiceClient()

    let targetApplicationId = applicationId
    if (!targetApplicationId && outboxId) {
      const { data: outbox } = await supabase
        .from('email_outbox')
        .select('payload, status')
        .eq('id', outboxId)
        .maybeSingle()

      if (!outbox || outbox.status !== 'pending') {
        return jsonResponse({ error: 'Outbox row not pending' }, 404)
      }

      const payload = outbox.payload as { application_id?: string }
      targetApplicationId = payload.application_id
    }

    if (!targetApplicationId) {
      return jsonResponse({ error: 'Application not found' }, 404)
    }

    const { data: application, error } = await supabase
      .from('applications')
      .select(
        `
        id,
        applicant_id,
        contact_email,
        status,
        job:jobs(title_ar, title_en, company:companies(name, name_ar)),
        applicant:profiles!applications_applicant_id_fkey(full_name)
      `,
      )
      .eq('id', targetApplicationId)
      .maybeSingle()

    if (error || !application) {
      return jsonResponse({ error: 'Application not found' }, 404)
    }

    if (application.status !== 'expired') {
      return jsonResponse({ error: 'Application is not expired' }, 400)
    }

    const job = Array.isArray(application.job) ? application.job[0] : application.job
    const company = job?.company
      ? Array.isArray(job.company)
        ? job.company[0]
        : job.company
      : null
    const applicant = Array.isArray(application.applicant)
      ? application.applicant[0]
      : application.applicant

    const to = await resolveRecipientEmail(
      supabase,
      application.applicant_id,
      application.contact_email,
    )

    if (!to) {
      return jsonResponse({ error: 'No recipient email' }, 422)
    }

    const vars = {
      applicant_name: applicant?.full_name?.trim() || 'المتقدم',
      job_title: job?.title_ar || job?.title_en || 'الفرصة',
      company_name: company?.name_ar || company?.name || 'الجهة',
    }

    await sendResendEmail({
      to,
      subject: EXPIRY_EMAIL_SUBJECT_AR,
      html: renderExpiryEmailHtml(vars),
    })

    if (outboxId) {
      await supabase
        .from('email_outbox')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', outboxId)
    }

    return jsonResponse({ sent: true, to, applicationId: targetApplicationId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return jsonResponse({ error: message }, 500)
  }
})
