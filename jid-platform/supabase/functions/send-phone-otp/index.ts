import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { generateOtp, generateSalt, hashOtp, isValidSaudiPhone, packOtpHash } from '../_shared/otp.ts'
import { createServiceClient, getUserFromRequest } from '../_shared/supabase.ts'
import { sendUnifonicSms } from '../_shared/unifonic.ts'

const OTP_TTL_MINUTES = 5

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

    const body = (await req.json()) as { phone?: string }
    const phone = body.phone?.trim()

    if (!phone || !isValidSaudiPhone(phone)) {
      return jsonResponse({ error: 'Invalid Saudi phone number' }, 400)
    }

    const supabase = createServiceClient()

    // Defense-in-depth: rate limit also enforced client-side BEFORE invoke
    const { error: rateError } = await supabase.rpc('check_otp_rate_limit', {
      p_user_id: user.id,
      p_phone: phone,
    })

    if (rateError) {
      return jsonResponse({ error: rateError.message }, 429)
    }

    const otp = generateOtp()
    const salt = generateSalt()
    const otpHash = packOtpHash(salt, await hashOtp(otp, salt))
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()

    const forwardedFor = req.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor?.split(',')[0]?.trim() ?? null

    const { error: insertError } = await supabase.from('phone_verification_attempts').insert({
      user_id: user.id,
      phone,
      otp_hash: otpHash,
      ip_address: ipAddress,
      expires_at: expiresAt,
    })

    if (insertError) {
      return jsonResponse({ error: insertError.message }, 500)
    }

    const smsBody =
      Deno.env.get('OTP_LOCALE') === 'en'
        ? `Your JID verification code is ${otp}. Valid for ${OTP_TTL_MINUTES} minutes.`
        : `رمز التحقق من جِد: ${otp}. صالح لمدة ${OTP_TTL_MINUTES} دقائق.`

    const smsResult = await sendUnifonicSms(phone, smsBody)

    if (!smsResult.success) {
      return jsonResponse({ error: smsResult.error ?? 'SMS delivery failed' }, 502)
    }

    // Section 12 DON'Ts: never log full OTP — event only
    console.log('OTP sent', {
      userId: user.id,
      phone,
      event: 'otp_sent',
    })

    return jsonResponse({ expiresAt })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return jsonResponse({ error: message }, 500)
  }
})
