/**
 * Client-safe OTP hash verify — mirrors supabase/functions/_shared/otp.ts
 */

export async function verifyOtpHash(otp: string, packed: string): Promise<boolean> {
  const [salt, expected] = packed.split(':')
  if (!salt || !expected) return false

  const data = new TextEncoder().encode(`${otp}${salt}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const actual = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return actual === expected
}
