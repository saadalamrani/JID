import { z } from 'zod'

export const addEmailSchema = z.object({
  email: z.string().trim().email('أدخل بريداً إلكترونياً صالحاً').transform((v) => v.toLowerCase()),
})

export const verifyEmailOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, 'أدخل رمزاً من 6 أرقام')
    .regex(/^\d{6}$/, 'أدخل أرقاماً فقط'),
})

export const jobPrivacySchema = z.object({
  show_profile_to_recruiters: z.boolean(),
  allow_company_direct_contact: z.boolean(),
  show_application_history: z.boolean(),
})

export type JobPrivacyValues = z.infer<typeof jobPrivacySchema>
