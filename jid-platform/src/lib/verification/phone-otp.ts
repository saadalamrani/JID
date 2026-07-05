import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { assertOtpRateLimit } from './rate-limit'

export type SendPhoneOtpResult = {
  expiresAt: string
}

export type VerifyPhoneOtpResult = {
  verified: boolean
}

/**
 * Request a phone OTP — rate limit check runs FIRST, then Edge Function invocation.
 */
export async function sendPhoneOtp(
  supabase: SupabaseClient<Database>,
  phone: string,
): Promise<SendPhoneOtpResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // CRITICAL: rate limit BEFORE edge function (Section 12 DON'Ts)
  await assertOtpRateLimit(supabase, user.id, phone)

  const { data, error } = await supabase.functions.invoke('send-phone-otp', {
    body: { phone },
  })

  if (error) {
    throw new Error(error.message)
  }

  const payload = data as { expiresAt?: string; error?: string } | null
  if (payload?.error) {
    throw new Error(payload.error)
  }

  if (!payload?.expiresAt) {
    throw new Error('Failed to send OTP')
  }

  return { expiresAt: payload.expiresAt }
}

/**
 * Verify a phone OTP via Edge Function (SHA-256 verification server-side).
 */
export async function verifyPhoneOtp(
  supabase: SupabaseClient<Database>,
  phone: string,
  otp: string,
): Promise<VerifyPhoneOtpResult> {
  const { data, error } = await supabase.functions.invoke('verify-phone-otp', {
    body: { phone, otp },
  })

  if (error) {
    throw new Error(error.message)
  }

  const payload = data as { verified?: boolean; error?: string } | null
  if (payload?.error) {
    throw new Error(payload.error)
  }

  return { verified: payload?.verified === true }
}
