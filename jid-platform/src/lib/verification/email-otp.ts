import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { OtpRateLimitError } from './rate-limit'

export type SendEmailOtpResult = {
  attemptId: string
  expiresAt: string
}

export async function sendEmailOtp(
  supabase: SupabaseClient<Database>,
  email: string,
): Promise<SendEmailOtpResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error('Authentication required')

  const normalized = email.trim().toLowerCase()
  const { error: rateError } = await supabase.rpc('check_email_otp_rate_limit', {
    p_user_id: user.id,
    p_email: normalized,
  })

  if (rateError) {
    if (rateError.message.includes('rate limit')) {
      throw new OtpRateLimitError(rateError.message)
    }
    throw new Error(rateError.message)
  }

  const { data, error } = await supabase.functions.invoke('send-email-otp', {
    body: { email: normalized },
  })

  if (error) throw new Error(error.message)

  const payload = data as { attemptId?: string; expiresAt?: string; error?: string } | null
  if (payload?.error) throw new Error(payload.error)
  if (!payload?.attemptId || !payload.expiresAt) throw new Error('Failed to send OTP')

  return { attemptId: payload.attemptId, expiresAt: payload.expiresAt }
}
