import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { isValidSaudiPhone, verifyOtpHash } from '../_shared/otp.ts'
import { createServiceClient, getUserFromRequest } from '../_shared/supabase.ts'

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

    const body = (await req.json()) as { phone?: string; otp?: string }
    const phone = body.phone?.trim()
    const otp = body.otp?.trim()

    if (!phone || !isValidSaudiPhone(phone)) {
      return jsonResponse({ error: 'Invalid Saudi phone number' }, 400)
    }

    if (!otp || !/^\d{6}$/.test(otp)) {
      return jsonResponse({ error: 'Invalid OTP format' }, 400)
    }

    const supabase = createServiceClient()

    const { data: attempt, error: fetchError } = await supabase
      .from('phone_verification_attempts')
      .select('id, otp_hash, is_verified, expires_at')
      .eq('user_id', user.id)
      .eq('phone', phone)
      .eq('is_verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError || !attempt) {
      return jsonResponse({ error: 'No active OTP verification attempt found' }, 400)
    }

    const valid = await verifyOtpHash(otp, attempt.otp_hash)
    if (!valid) {
      return jsonResponse({ error: 'Invalid OTP code' }, 400)
    }

    const { error: attemptUpdateError } = await supabase
      .from('phone_verification_attempts')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('id', attempt.id)

    if (attemptUpdateError) {
      return jsonResponse({ error: attemptUpdateError.message }, 500)
    }

    const { data: profileBefore } = await supabase
      .from('profiles')
      .select('phone, phone_verified_at')
      .eq('id', user.id)
      .maybeSingle()

    const verifiedAt = new Date().toISOString()

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        phone,
        phone_verified_at: verifiedAt,
        updated_at: verifiedAt,
      })
      .eq('id', user.id)

    if (profileError) {
      return jsonResponse({ error: profileError.message }, 500)
    }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'user.phone_verified',
      entity_type: 'profile',
      entity_id: user.id,
      old_data: {
        phone: profileBefore?.phone ?? null,
        phone_verified_at: profileBefore?.phone_verified_at ?? null,
      },
      new_data: {
        phone,
        phone_verified_at: verifiedAt,
      },
      metadata: { source: 'verify-phone-otp-edge' },
    })

    console.log('Phone verified', { userId: user.id, phone, event: 'phone_verified' })

    return jsonResponse({ verified: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return jsonResponse({ error: message }, 500)
  }
})
