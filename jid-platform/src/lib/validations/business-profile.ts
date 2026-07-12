import { z } from 'zod'
import { bilingualNameSchema } from '@/lib/utils/validators'

export const EMPLOYEE_COUNT_RANGES = ['1-10', '11-50', '51-200', '201-1000', '1000+'] as const

export type EmployeeCountRange = (typeof EMPLOYEE_COUNT_RANGES)[number]

export const businessProfileIdentitySchema = z.object({
  display_name_ar: bilingualNameSchema,
  display_name_en: z
    .string()
    .transform((v) => v.replace(/\s+/g, ' ').trim())
    .pipe(z.string().max(100).optional().or(z.literal('')))
    .optional(),
  tagline_ar: z
    .string()
    .transform((v) => v.replace(/\s+/g, ' ').trim())
    .pipe(z.string().max(120).optional().or(z.literal('')))
    .optional(),
})

export const businessProfileStorySchema = z.object({
  about_ar: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().max(4000).optional().or(z.literal('')))
    .optional(),
  about_en: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().max(4000).optional().or(z.literal('')))
    .optional(),
  founded_year: z
    .union([z.literal(''), z.coerce.number().int().min(1800).max(new Date().getFullYear())])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  employee_count_range: z.enum(EMPLOYEE_COUNT_RANGES).optional().nullable(),
  cover_image_url: z.string().url().optional().nullable().or(z.literal('')),
})

export const businessProfileDraftSchema = businessProfileIdentitySchema.merge(
  businessProfileStorySchema,
)

export type BusinessProfileDraft = z.infer<typeof businessProfileDraftSchema>

export const EMPTY_BUSINESS_PROFILE_DRAFT: BusinessProfileDraft = {
  display_name_ar: '',
  display_name_en: '',
  tagline_ar: '',
  about_ar: '',
  about_en: '',
  founded_year: null,
  employee_count_range: null,
  cover_image_url: '',
}
