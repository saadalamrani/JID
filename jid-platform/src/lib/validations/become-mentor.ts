import { z } from 'zod'
import {
  MENTOR_LANGUAGE_OPTIONS,
  MENTOR_MEDIUM_OPTIONS,
} from '@/lib/mentor-application/constants'

const languageValues = MENTOR_LANGUAGE_OPTIONS.map((option) => option.value) as [
  string,
  ...string[],
]
const mediumValues = MENTOR_MEDIUM_OPTIONS.map((option) => option.value) as [string, ...string[]]

const linkedinUrlSchema = z
  .string()
  .trim()
  .min(1, 'رابط LinkedIn مطلوب')
  .url('رابط غير صالح')
  .refine((value) => /linkedin\.com/i.test(value), {
    message: 'يجب أن يكون الرابط من linkedin.com',
  })

export const becomeMentorSchema = z.object({
  headline: z.string().trim().min(1, 'العنوان المهني مطلوب').max(120),
  current_job_title: z.string().trim().min(1, 'المسمى الوظيفي مطلوب').max(120),
  current_company: z.string().trim().min(1, 'اسم الشركة مطلوب').max(120),
  years_experience: z.coerce
    .number()
    .int('أدخل عدد سنوات صحيحاً')
    .min(0, 'لا يمكن أن تكون السنوات سالبة')
    .max(60, 'الحد الأقصى 60 سنة'),
  expertise_areas: z
    .array(z.string().trim().min(1))
    .min(1, 'أضف مجالاً واحداً على الأقل')
    .max(5, 'الحد الأقصى 5 مجالات'),
  bio_long: z
    .string()
    .trim()
    .min(1, 'نبذة المرشد مطلوبة')
    .max(500, 'الحد الأقصى 500 حرف'),
  languages: z
    .array(z.enum(languageValues))
    .min(1, 'اختر لغة واحدة على الأقل'),
  preferred_mediums: z
    .array(z.enum(mediumValues))
    .min(1, 'اختر وسيلة تواصل واحدة على الأقل'),
  linkedin_url: linkedinUrlSchema,
})

export type BecomeMentorInput = z.infer<typeof becomeMentorSchema>

export const EMPTY_BECOME_MENTOR_DRAFT: BecomeMentorInput = {
  headline: '',
  current_job_title: '',
  current_company: '',
  years_experience: 0,
  expertise_areas: [],
  bio_long: '',
  languages: [],
  preferred_mediums: [],
  linkedin_url: '',
}
