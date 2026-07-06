import { addDays, addMonths, startOfDay } from 'date-fns'
import { z } from 'zod'
import { EXPERIENCE_LEVELS } from '@/types/job'

function deadlineBounds() {
  const today = startOfDay(new Date())
  const min = addDays(today, 1)
  const max = addMonths(today, 6)
  return { min, max }
}

export const jobPostingSchema = z.object({
  title_ar: z.string().trim().min(3, 'أدخل عنواناً بالعربية (3 أحرف على الأقل)'),
  title_en: z.string().trim().optional(),
  experience_level: z.enum(EXPERIENCE_LEVELS),
  sector_slug: z.string().trim().min(1, 'اختر القطاع'),
  region_slug: z.string().trim().min(1, 'اختر المنطقة'),
  city: z.string().trim().min(2, 'أدخل المدينة'),
  external_apply_url: z.string().trim().url('أدخل رابطاً صالحاً'),
  application_deadline: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'اختر تاريخاً صالحاً')
    .refine((value) => {
      const date = startOfDay(new Date(`${value}T00:00:00`))
      const { min, max } = deadlineBounds()
      return date >= min && date <= max
    }, 'يجب أن يكون الموعد النهائي بين غداً وستة أشهر'),
  description_ar: z.string().trim().min(20, 'أدخل وصفاً للفرصة (20 حرفاً على الأقل)'),
  required_skills: z
    .array(z.string().trim().min(1))
    .min(1, 'أضف مهارة واحدة على الأقل')
    .max(20),
  publish: z.boolean(),
})

export type JobPostingInput = z.infer<typeof jobPostingSchema>

export type JobPostingDraft = Omit<JobPostingInput, 'publish'>

export const EMPTY_JOB_POSTING_DRAFT: JobPostingDraft = {
  title_ar: '',
  title_en: '',
  experience_level: 'entry',
  sector_slug: '',
  region_slug: '',
  city: '',
  external_apply_url: '',
  application_deadline: '',
  description_ar: '',
  required_skills: [],
}

export function getDeadlineInputBounds(): { min: string; max: string } {
  const { min, max } = deadlineBounds()
  const toInput = (date: Date) => date.toISOString().slice(0, 10)
  return { min: toInput(min), max: toInput(max) }
}
