import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { sendResendEmail } from '../_shared/resend.ts'
import { createServiceClient } from '../_shared/supabase.ts'

type TemplateSnapshot = {
  kind?: string
  subject_ar?: string
  body_ar?: string
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

function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template
    .replaceAll('{candidate_name}', vars.candidate_name)
    .replaceAll('{applicant_name}', vars.candidate_name)
    .replaceAll('{job_title}', vars.job_title)
    .replaceAll('{company_name}', vars.company_name)
    .replaceAll('{next_step}', vars.next_step)
    .replaceAll('{timeline}', vars.timeline)
}

function renderHtml(body: string): string {
  const paragraphs = body
    .split('\n\n')
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
  return `<div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">${paragraphs.join('')}</div>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.includes(serviceKey ?? '__missing__')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  try {
    const supabase = createServiceClient()
    const limit = Number(new URL(req.url).searchParams.get('limit') ?? '10')

    const { data: batches, error: claimError } = await supabase.rpc('claim_due_communication_batches', {
      p_limit: limit,
    })

    if (claimError) {
      return jsonResponse({ error: claimError.message }, 500)
    }

    const processed: Array<{ batchId: string; sent: number; failed: number }> = []

    for (const batch of batches ?? []) {
      const snapshot = batch.template_snapshot as TemplateSnapshot
      const subject = snapshot.subject_ar?.trim() ?? 'تحديث على طلبك — جِد'
      const bodyTemplate = snapshot.body_ar?.trim() ?? ''

      let sent = 0
      let failed = 0

      for (const applicationId of batch.recipient_application_ids as string[]) {
        const { data: application } = await supabase
          .from('applications')
          .select(
            `
            id,
            applicant_id,
            contact_email,
            job:jobs(title_ar, title_en, company:companies(name, name_ar)),
            applicant:profiles!applications_applicant_id_fkey(full_name)
          `,
          )
          .eq('id', applicationId)
          .maybeSingle()

        if (!application) {
          failed += 1
          await supabase.from('communication_log').insert({
            batch_id: batch.id,
            application_id: applicationId,
            kind: batch.kind,
            status: 'failed',
          })
          continue
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
          failed += 1
          await supabase.from('communication_log').insert({
            batch_id: batch.id,
            application_id: applicationId,
            kind: batch.kind,
            status: 'failed',
          })
          continue
        }

        const vars = {
          candidate_name: applicant?.full_name?.trim() || 'المتقدم',
          job_title: job?.title_ar || job?.title_en || 'الفرصة',
          company_name: company?.name_ar || company?.name || 'الجهة',
          next_step: '—',
          timeline: '—',
        }

        try {
          await sendResendEmail({
            to,
            subject,
            html: renderHtml(renderTemplate(bodyTemplate, vars)),
          })

          sent += 1
          await supabase.from('communication_log').insert({
            batch_id: batch.id,
            application_id: applicationId,
            kind: batch.kind,
            status: 'sent',
          })
        } catch (sendError) {
          console.error('comm batch send failed', applicationId, sendError)
          failed += 1
          await supabase.from('communication_log').insert({
            batch_id: batch.id,
            application_id: applicationId,
            kind: batch.kind,
            status: 'failed',
          })
        }
      }

      const finalStatus = failed > 0 && sent === 0 ? 'failed' : 'sent'
      await supabase.rpc('finalize_communication_batch', {
        p_batch_id: batch.id,
        p_sent_count: sent,
        p_failed_count: failed,
        p_status: finalStatus,
      })

      processed.push({ batchId: batch.id, sent, failed })
    }

    return jsonResponse({ processed, count: processed.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return jsonResponse({ error: message }, 500)
  }
})
