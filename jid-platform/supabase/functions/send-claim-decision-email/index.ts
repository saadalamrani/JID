import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceClient, getUserFromRequest } from '../_shared/supabase.ts'

type DecisionBody = {
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
    const claimId = body.claimId?.trim()
    const decision = body.decision

    if (!claimId || (decision !== 'approve' && decision !== 'reject')) {
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

    const { data: claim, error: claimError } = await supabase
      .from('claim_requests')
      .select('business_email, company_name, claimant_name, status, review_notes, rejection_reason')
      .eq('id', claimId)
      .maybeSingle()

    if (claimError || !claim) {
      return jsonResponse({ error: 'Claim not found' }, 404)
    }

    const subject =
      decision === 'approve'
        ? `تمت الموافقة على مطالبة ${claim.company_name} — جِد`
        : `تم رفض مطالبة ${claim.company_name} — جِد`

    // Dev/local: log only — wire SMTP provider in production
    console.log('Claim decision email sent', {
      to: claim.business_email,
      subject,
      decision,
      claimant: claim.claimant_name,
    })

    return jsonResponse({ sent: true, to: claim.business_email })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return jsonResponse({ error: message }, 500)
  }
})
