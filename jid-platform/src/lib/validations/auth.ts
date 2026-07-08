import { z } from 'zod'
import { bilingualNameSchema, strongPasswordSchema } from '@/lib/utils/validators'

export const signupSchema = z.object({
  full_name: bilingualNameSchema,
  email: z.string().trim().email({ message: 'auth.validation.emailInvalid' }),
  password: strongPasswordSchema,
  accept_terms: z
    .boolean()
    .refine((value) => value === true, { message: 'auth.validation.acceptTerms' }),
})

export type SignupFormValues = z.infer<typeof signupSchema>

export const phoneEntrySchema = z.object({
  phone: z.string().trim().min(1, { message: 'auth.validation.phoneRequired' }),
})

export type PhoneEntryFormValues = z.infer<typeof phoneEntrySchema>

export const otpEntrySchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, { message: 'auth.validation.otpLength' })
    .regex(/^\d{6}$/, { message: 'auth.validation.otpDigits' }),
})

export type OtpEntryFormValues = z.infer<typeof otpEntrySchema>

export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'auth.validation.emailInvalid' }),
  password: z.string().min(1, { message: 'auth.validation.passwordRequired' }),
})

export type LoginFormValues = z.infer<typeof loginSchema>

/** Section 12 DON'Ts — single generic message; never reveal email vs password failure. */
export const GENERIC_LOGIN_ERROR_KEY = 'auth.login.errors.generic' as const

export const MIN_LOGIN_DELAY_MS = 900
