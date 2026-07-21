import { z } from 'zod'
import { bilingualNameSchema } from '@/lib/utils/validators'

export const UNIVERSITY_TYPES = ['government', 'private'] as const
export type UniversityType = (typeof UNIVERSITY_TYPES)[number]

export const universityProfileIdentitySchema = z.object({
  display_name_ar: bilingualNameSchema,
  display_name_en: z
    .string()
    .transform((v) => v.replace(/\s+/g, ' ').trim())
    .pipe(z.string().max(100).optional().or(z.literal('')))
    .optional(),
})

export const universityProfileInstitutionSchema = z.object({
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
  university_type: z.enum(UNIVERSITY_TYPES).optional().nullable(),
  established_year: z
    .union([z.literal(''), z.coerce.number().int().min(1800).max(new Date().getFullYear())])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  cover_image_url: z.string().url().optional().nullable().or(z.literal('')),
})

export const universityProfileDraftSchema = universityProfileIdentitySchema.merge(
  universityProfileInstitutionSchema,
)

export type UniversityProfileDraft = z.infer<typeof universityProfileDraftSchema>

export const EMPTY_UNIVERSITY_PROFILE_DRAFT: UniversityProfileDraft = {
  display_name_ar: '',
  display_name_en: '',
  about_ar: '',
  about_en: '',
  university_type: null,
  established_year: null,
  cover_image_url: '',
}
