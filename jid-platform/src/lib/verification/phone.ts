const E164_SAUDI_REGEX = /^\+9665\d{8}$/

/** Normalize user input to E.164 Saudi format (+9665XXXXXXXX). */
export function normalizeSaudiPhoneE164(input: string): string {
  const digits = input.replace(/[\s\-()]/g, '').replace(/^\+/, '')

  if (digits.startsWith('966')) {
    return `+${digits}`
  }

  if (digits.startsWith('0')) {
    return `+966${digits.slice(1)}`
  }

  if (digits.length === 9 && digits.startsWith('5')) {
    return `+966${digits}`
  }

  return `+966${digits}`
}

export function isValidSaudiPhoneE164(phone: string): boolean {
  return E164_SAUDI_REGEX.test(phone)
}

/** Unifonic expects 9665XXXXXXXX (no + prefix). */
export function toUnifonicRecipient(e164: string): string {
  return e164.replace(/^\+/, '')
}
