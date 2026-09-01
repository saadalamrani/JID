import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { sendResendEmail } from '../_shared/resend.ts'
import { createServiceClient, getUserFromRequest } from '../_shared/supabase.ts'

type Body = { verificationId?: string; claimId?: string }

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

    const body = (await req.json()) as Body
    const verificationId = (body.verificationId ?? body.claimId)?.trim()
    if (!verificationId) return jsonResponse({ error: 'Invalid payload' }, 400)

    const { data: request } = await supabase
      .from('verification_requests')
      .select('business_email, company_name, representative_name, rejection_reason, can_reapply_after, required_documents')
      .eq('id', verificationId)
      .maybeSingle()

    if (!request) return jsonResponse({ error: 'Verification request not found' }, 404)

    const docs = (request.required_documents ?? []).join('، ')
    const reapply = request.can_reapply_after
      ? new Date(request.can_reapply_after).toLocaleString('ar-SA')
      : ''

    await sendResendEmail({
      to: request.business_email,
      subject: `تم رفض التحقق لـ ${request.company_name} — جِد`,
      html: `<div dir="rtl">
        <p>مرحباً ${request.representative_name}،</p>
        <p>تم رفض طلب التحقق لجهة <strong>${request.company_name}</strong>.</p>
        <p><strong>السبب:</strong> ${request.rejection_reason ?? ''}</p>
        <p><strong>المستندات المطلوبة:</strong> ${docs}</p>
        <p>يمكنك إعادة التقديم بعد: ${reapply}</p>
      </div>`,
    })

    return jsonResponse({ sent: true })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Internal error' }, 500)
  }
})
