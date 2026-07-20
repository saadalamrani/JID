import { z } from 'zod'
import { bilingualNameSchema } from '@/lib/utils/validators'

export const universityProfileIdentitySchema = z.object({
  display_name_ar: bilingualNameSchema,
  display_name_en: z
    .string()
    .transform((v) => v.replace(/\s+/g, ' ').trim())
    .pipe(z.string().max(100).optional().or(z.literal('')))
    .optional(),
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
})

export type UniversityProfileDraft = z.infer<typeof universityProfileIdentitySchema>

export const EMPTY_UNIVERSITY_PROFILE_DRAFT: UniversityProfileDraft = {
  display_name_ar: '',
  display_name_en: '',
  about_ar: '',
  about_en: '',
}
