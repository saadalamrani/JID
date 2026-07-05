import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export class OtpRateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OtpRateLimitError'
  }
}

/**
 * Enforce OTP rate limits via check_otp_rate_limit() RPC.
 * MUST be called before invoking send-phone-otp (Section 12 DON'Ts).
 */
export async function assertOtpRateLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  phone: string,
): Promise<void> {
  const { error } = await supabase.rpc('check_otp_rate_limit', {
    p_user_id: userId,
    p_phone: phone,
  })

  if (error) {
    if (error.message.includes('rate limit')) {
      throw new OtpRateLimitError(error.message)
    }
    throw new Error(error.message)
  }
}
