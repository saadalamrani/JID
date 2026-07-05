import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { sendResendEmail } from '../_shared/resend.ts'
import { createServiceClient, getUserFromRequest } from '../_shared/supabase.ts'

type Body = { claimId?: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const user = await getUserFromRequest(req)
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const supabase = createServiceClient()
    const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (!actor || !['staff', 'admin', 'super_admin'].includes(actor.role)) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    const claimId = ((await req.json()) as Body).claimId?.trim()
    if (!claimId) return jsonResponse({ error: 'Invalid payload' }, 400)

    const { data: claim } = await supabase
      .from('claim_requests')
      .select('business_email, company_name, claimant_name, rejection_reason, can_reapply_after, required_documents')
      .eq('id', claimId)
      .maybeSingle()

    if (!claim) return jsonResponse({ error: 'Claim not found' }, 404)

    const docs = (claim.required_documents ?? []).join('، ')
    const reapply = claim.can_reapply_after
      ? new Date(claim.can_reapply_after).toLocaleString('ar-SA')
      : ''

    await sendResendEmail({
      to: claim.business_email,
      subject: `تم رفض مطالبة ${claim.company_name} — جِد`,
      html: `<div dir="rtl">
        <p>مرحباً ${claim.claimant_name}،</p>
        <p>تم رفض مطالبة ملكية <strong>${claim.company_name}</strong>.</p>
        <p><strong>السبب:</strong> ${claim.rejection_reason ?? ''}</p>
        <p><strong>المستندات المطلوبة:</strong> ${docs}</p>
        <p>يمكنك إعادة التقديم بعد: ${reapply}</p>
      </div>`,
    })

    return jsonResponse({ sent: true })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Internal error' }, 500)
  }
})
