import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { generateOtp, generateSalt, hashOtp, packOtpHash } from '../_shared/otp.ts'
import { sendResendEmail } from '../_shared/resend.ts'
import { createServiceClient, getUserFromRequest } from '../_shared/supabase.ts'

const OTP_TTL_MINUTES = 5

function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const user = await getUserFromRequest(req)
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const body = (await req.json()) as { email?: string }
    const email = body.email?.trim().toLowerCase()

    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: 'Invalid email address' }, 400)
    }

    const supabase = createServiceClient()

    const { error: rateError } = await supabase.rpc('check_email_otp_rate_limit', {
      p_user_id: user.id,
      p_email: email,
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

    const { data: attempt, error: insertError } = await supabase
      .from('email_verification_attempts')
      .insert({
        user_id: user.id,
        email,
        otp_hash: otpHash,
        ip_address: ipAddress,
        expires_at: expiresAt,
      })
      .select('id')
      .single()

    if (insertError || !attempt) {
      return jsonResponse({ error: insertError?.message ?? 'Failed to create attempt' }, 500)
    }

    await sendResendEmail({
      to: email,
      subject: 'رمز التحقق من بريدك — جِد',
      html: `<div dir="rtl"><p>رمز التحقق من جِد: <strong>${otp}</strong></p><p>صالح لمدة ${OTP_TTL_MINUTES} دقائق.</p></div>`,
    })

    console.log('Email OTP sent', { userId: user.id, email, event: 'email_otp_sent' })

    return jsonResponse({ attemptId: attempt.id, expiresAt })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return jsonResponse({ error: message }, 500)
  }
})
