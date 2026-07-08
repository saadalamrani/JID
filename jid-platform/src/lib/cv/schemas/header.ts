import { z } from 'zod'
import { bilingualNameSchema } from '@/lib/utils/validators'
import { CV_STATUSES } from '@/types/cv'

const optionalUrl = z
  .string()
  .trim()
  .url('رابط غير صالح')
  .optional()
  .or(z.literal(''))

const optionalEmail = z
  .string()
  .trim()
  .email('البريد الإلكتروني غير صالح')
  .optional()
  .or(z.literal(''))

const optionalLabel = z.string().trim().max(40).optional().or(z.literal(''))

/** Form + PATCH shape (empty strings allowed in UI). */
export const cvHeaderFormSchema = z.object({
  title: z.string().trim().min(1, 'عنوان السيرة مطلوب').max(120),
  status: z.enum(CV_STATUSES).default('draft'),
  locale: z.enum(['ar', 'en']).default('ar'),
  is_primary: z.boolean().default(false),
  full_name: bilingualNameSchema,
  email: optionalEmail,
  phone: z.string().trim().max(32).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  linkedin_url: optionalUrl,
  github_url: optionalUrl,
  portfolio_url: optionalUrl,
  custom_link_1_label: optionalLabel,
  custom_link_1_url: optionalUrl,
  custom_link_2_label: optionalLabel,
  custom_link_2_url: optionalUrl,
  summary: z.string().trim().max(2000, 'الملخص طويل جداً').optional().or(z.literal('')),
  template_key: z.string().trim().min(1).max(40).default('classic'),
})

export type CvHeaderFormValues = z.infer<typeof cvHeaderFormSchema>

/** Section 7.6 — header editor fields only. */
export const cvHeaderSectionSchema = cvHeaderFormSchema.pick({
  full_name: true,
  city: true,
  country: true,
  email: true,
  phone: true,
  linkedin_url: true,
  github_url: true,
  portfolio_url: true,
  custom_link_1_label: true,
  custom_link_1_url: true,
  custom_link_2_label: true,
  custom_link_2_url: true,
})

export type CvHeaderSectionValues = z.infer<typeof cvHeaderSectionSchema>

export const cvHeaderSchema = cvHeaderFormSchema

export type CvHeaderInput = CvHeaderFormValues

export const cvHeaderPatchSchema = cvHeaderFormSchema.partial()

export type CvHeaderPatchInput = z.infer<typeof cvHeaderPatchSchema>

/** DB/API patch — empty form fields become `null`. */
export type CvHeaderDbPatch = {
  full_name?: string
  city?: string | null
  country?: string | null
  email?: string | null
  phone?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  custom_link_1_label?: string | null
  custom_link_1_url?: string | null
  custom_link_2_label?: string | null
  custom_link_2_url?: string | null
}

const dbNullableString = z.union([z.string(), z.null()]).optional()

export const cvHeaderSectionDbPatchSchema = z
  .object({
    full_name: bilingualNameSchema.optional(),
    city: dbNullableString,
    country: dbNullableString,
    email: z.union([z.string().trim().email('البريد الإلكتروني غير صالح'), z.null()]).optional(),
    phone: dbNullableString,
    linkedin_url: z.union([z.string().trim().url('رابط غير صالح'), z.null()]).optional(),
    github_url: z.union([z.string().trim().url('رابط غير صالح'), z.null()]).optional(),
    portfolio_url: z.union([z.string().trim().url('رابط غير صالح'), z.null()]).optional(),
    custom_link_1_label: dbNullableString,
    custom_link_1_url: z.union([z.string().trim().url('رابط غير صالح'), z.null()]).optional(),
    custom_link_2_label: dbNullableString,
    custom_link_2_url: z.union([z.string().trim().url('رابط غير صالح'), z.null()]).optional(),
  })
  .strict()

export function emptyStringToNull(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** Normalize form values for API / DB (empty → null). */
export function normalizeCvHeaderPatch(values: CvHeaderSectionValues): CvHeaderDbPatch {
  return {
    full_name: values.full_name.trim(),
    city: emptyStringToNull(values.city),
    country: emptyStringToNull(values.country),
    email: emptyStringToNull(values.email),
    phone: emptyStringToNull(values.phone),
    linkedin_url: emptyStringToNull(values.linkedin_url),
    github_url: emptyStringToNull(values.github_url),
    portfolio_url: emptyStringToNull(values.portfolio_url),
    custom_link_1_label: emptyStringToNull(values.custom_link_1_label),
    custom_link_1_url: emptyStringToNull(values.custom_link_1_url),
    custom_link_2_label: emptyStringToNull(values.custom_link_2_label),
    custom_link_2_url: emptyStringToNull(values.custom_link_2_url),
  }
}

export function cvRecordToHeaderSectionValues(cv: {
  full_name: string | null
  city: string | null
  country: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  github_url?: string | null
  portfolio_url?: string | null
  custom_link_1_label?: string | null
  custom_link_1_url?: string | null
  custom_link_2_label?: string | null
  custom_link_2_url?: string | null
}): CvHeaderSectionValues {
  return {
    full_name: cv.full_name ?? '',
    city: cv.city ?? '',
    country: cv.country ?? '',
    email: cv.email ?? '',
    phone: cv.phone ?? '',
    linkedin_url: cv.linkedin_url ?? '',
    github_url: cv.github_url ?? '',
    portfolio_url: cv.portfolio_url ?? '',
    custom_link_1_label: cv.custom_link_1_label ?? '',
    custom_link_1_url: cv.custom_link_1_url ?? '',
    custom_link_2_label: cv.custom_link_2_label ?? '',
    custom_link_2_url: cv.custom_link_2_url ?? '',
  }
}
