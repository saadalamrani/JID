const OTP_LENGTH = 6
const SALT_BYTES = 16

export function generateOtp(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const value = array[0]! % 1_000_000
  return value.toString().padStart(OTP_LENGTH, '0')
}

export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashOtp(otp: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${otp}${salt}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function packOtpHash(salt: string, hash: string): string {
  return `${salt}:${hash}`
}

export async function verifyOtpHash(otp: string, packed: string): Promise<boolean> {
  const [salt, expected] = packed.split(':')
  if (!salt || !expected) return false
  const actual = await hashOtp(otp, salt)
  return actual === expected
}

export function isValidSaudiPhone(phone: string): boolean {
  return /^\+9665\d{8}$/.test(phone)
}
