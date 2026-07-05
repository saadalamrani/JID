/** Saudi mobile: +9665XXXXXXXX, 9665XXXXXXXX, 05XXXXXXXX, or 5XXXXXXXX */
export const SAUDI_PHONE_REGEX = /^(?:\+966|966|0)?5\d{8}$/

/** Arabic letters and spaces (includes common diacritics) */
export const ARABIC_NAME_REGEX = /^[\u0600-\u06FF\u0750-\u077F\s\u064B-\u065F]+$/

export function isValidSaudiPhone(value: string): boolean {
  return SAUDI_PHONE_REGEX.test(value.replace(/[\s-]/g, ''))
}

export function isValidArabicName(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length >= 2 && ARABIC_NAME_REGEX.test(trimmed)
}
