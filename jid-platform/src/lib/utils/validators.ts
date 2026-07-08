import { z } from 'zod'

/** Saudi mobile: +9665XXXXXXXX, 9665XXXXXXXX, 05XXXXXXXX, or 5XXXXXXXX */
export const SAUDI_PHONE_REGEX = /^(?:\+966|966|0)?5\d{8}$/

/** Arabic letters and spaces (includes common diacritics) — legacy helper only */
export const ARABIC_NAME_REGEX = /^[\u0600-\u06FF\u0750-\u077F\s\u064B-\u065F]+$/

export const bilingualNameSchema = z
  .string()
  .transform((v) => v.replace(/\s+/g, ' ').trim())
  .pipe(
    z
      .string()
      .min(2, 'الاسم قصير جداً')
      .max(100, 'الاسم طويل جداً')
      .regex(/^[\u0600-\u06FFa-zA-Z\s'-]+$/, 'استخدم أحرفاً عربية أو إنجليزية فقط')
      .refine((v) => !/\s{2,}/.test(v), 'لا مسافات متكررة'),
  )

export const strongPasswordSchema = z
  .string()
  .min(8, 'كلمة المرور 8 أحرف على الأقل')
  .regex(/[A-Z]/, 'حرف كبير واحد على الأقل')
  .regex(/[a-z]/, 'حرف صغير واحد على الأقل')
  .regex(/[0-9]/, 'رقم واحد على الأقل')
  .regex(/[^A-Za-z0-9]/, 'رمز خاص واحد على الأقل')

export type PasswordRequirementKey =
  | 'length'
  | 'uppercase'
  | 'lowercase'
  | 'number'
  | 'special'

export const PASSWORD_REQUIREMENT_CHECKS: Record<
  PasswordRequirementKey,
  (value: string) => boolean
> = {
  length: (value) => value.length >= 8,
  uppercase: (value) => /[A-Z]/.test(value),
  lowercase: (value) => /[a-z]/.test(value),
  number: (value) => /[0-9]/.test(value),
  special: (value) => /[^A-Za-z0-9]/.test(value),
}

export function isStrongPassword(value: string): boolean {
  return strongPasswordSchema.safeParse(value).success
}

export function isValidSaudiPhone(value: string): boolean {
  return SAUDI_PHONE_REGEX.test(value.replace(/[\s-]/g, ''))
}

export function isValidArabicName(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length >= 2 && ARABIC_NAME_REGEX.test(trimmed)
}
