import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceClient, getUserFromRequest } from '../_shared/supabase.ts'

type DecisionBody = {
  verificationId?: string
  claimId?: string
  decision?: 'approve' | 'reject'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const body = (await req.json()) as DecisionBody
    const verificationId = (body.verificationId ?? body.claimId)?.trim()
    const decision = body.decision

    if (!verificationId || (decision !== 'approve' && decision !== 'reject')) {
      return jsonResponse({ error: 'Invalid payload' }, 400)
    }

    const supabase = createServiceClient()

    const { data: actor } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!actor || !['staff', 'admin', 'super_admin'].includes(actor.role)) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    const { data: request, error: requestError } = await supabase
      .from('verification_requests')
      .select('business_email, company_name, representative_name, status, review_notes, rejection_reason')
      .eq('id', verificationId)
      .maybeSingle()

    if (requestError || !request) {
      return jsonResponse({ error: 'Verification request not found' }, 404)
    }

    const subject =
      decision === 'approve'
        ? `تمت الموافقة على التحقق لـ ${request.company_name} — جِد`
        : `تم رفض التحقق لـ ${request.company_name} — جِد`

    console.log('Verification decision email sent', {
      to: request.business_email,
      subject,
      decision,
      representative: request.representative_name,
    })

    return jsonResponse({ sent: true, to: request.business_email })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return jsonResponse({ error: message }, 500)
  }
})
