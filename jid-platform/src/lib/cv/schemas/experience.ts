import { z } from 'zod'
import type { CvExperienceRecord } from '@/types/cv'

const monthSchema = z
  .number()
  .int()
  .min(1, 'الشهر غير صالح')
  .max(12, 'الشهر غير صالح')
  .nullable()

const yearSchema = z
  .number()
  .int()
  .min(1950, 'السنة غير صالحة')
  .max(2100, 'السنة غير صالحة')
  .nullable()

function numberFromInput(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

const monthFromInput = z.preprocess(numberFromInput, monthSchema)
const yearFromInput = z.preprocess(numberFromInput, yearSchema)

const optionalText = z.string().trim().max(200).optional().or(z.literal(''))

const bulletSchema = z.string().trim().max(500)

const experienceEntryBase = {
  company_name: z.string().trim().min(1, 'اسم المنظمة مطلوب').max(200),
  company_city: optionalText,
  company_country: optionalText,
  job_title: z.string().trim().min(1, 'المسمى الوظيفي مطلوب').max(120),
  employment_type: z.string().trim().max(120).optional().or(z.literal('')),
  start_month: monthFromInput,
  start_year: yearFromInput,
  end_month: monthFromInput,
  end_year: yearFromInput,
  is_current: z.boolean().default(false),
  bullets: z.array(bulletSchema).max(20, 'الحد الأقصى 20 نقطة').default([]),
  sort_order: z.number().int().min(0).default(0),
}

function refineExperienceDates<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data, ctx) => {
    const entry = data as {
      is_current: boolean
      end_month: number | null
      end_year: number | null
      bullets: string[]
    }

    if (entry.is_current && (entry.end_month != null || entry.end_year != null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'أزل تاريخ الانتهاء عند اختيار «أعمل حالياً»',
        path: ['is_current'],
      })
    }

    const nonEmptyBullets = entry.bullets.map((bullet) => bullet.trim()).filter(Boolean)
    if (nonEmptyBullets.length > 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'الحد الأقصى 20 نقطة',
        path: ['bullets'],
      })
    }
  })
}

const cvExperienceEntryObjectSchema = z.object(experienceEntryBase)

/** Section 7.8 — single experience entry (form + API). */
export const cvExperienceEntrySchema = refineExperienceDates(cvExperienceEntryObjectSchema)

export type CvExperienceEntryInput = z.infer<typeof cvExperienceEntrySchema>

export const cvExperienceListSchema = z
  .array(cvExperienceEntrySchema)
  .max(20, 'الحد الأقصى 20 خبرة')

export type CvExperienceListInput = z.infer<typeof cvExperienceListSchema>

export const cvExperienceCreateSchema = cvExperienceEntryObjectSchema.pick({
  company_name: true,
  job_title: true,
  sort_order: true,
})

const dbNullableString = z.union([z.string(), z.null()]).optional()
const dbNullableNumber = z.union([z.number(), z.null()]).optional()

export const cvExperienceDbUpdateSchema = z
  .object({
    company_name: z.string().trim().min(1, 'اسم المنظمة مطلوب').max(200).optional(),
    company_city: dbNullableString,
    company_country: dbNullableString,
    job_title: z.string().trim().min(1, 'المسمى الوظيفي مطلوب').max(120).optional(),
    employment_type: dbNullableString,
    start_month: dbNullableNumber,
    start_year: dbNullableNumber,
    end_month: dbNullableNumber,
    end_year: dbNullableNumber,
    is_current: z.boolean().optional(),
    bullets: z.array(z.string().trim().max(500)).max(20).optional(),
  })
  .strict()

export const cvExperienceReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
})

export type CvExperienceDbPatch = {
  company_name?: string
  company_city?: string | null
  company_country?: string | null
  job_title?: string
  employment_type?: string | null
  start_month?: number | null
  start_year?: number | null
  end_month?: number | null
  end_year?: number | null
  is_current?: boolean
  bullets?: string[]
  sort_order?: number
}

function emptyStringToNull(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function normalizeBullets(bullets: string[]): string[] {
  return bullets.map((bullet) => bullet.trim()).filter(Boolean)
}

export function normalizeExperienceUpdate(values: CvExperienceEntryInput): CvExperienceDbPatch {
  return {
    company_name: values.company_name.trim(),
    company_city: emptyStringToNull(values.company_city),
    company_country: emptyStringToNull(values.company_country),
    job_title: values.job_title.trim(),
    employment_type: emptyStringToNull(values.employment_type),
    start_month: values.start_month,
    start_year: values.start_year,
    end_month: values.is_current ? null : values.end_month,
    end_year: values.is_current ? null : values.end_year,
    is_current: values.is_current,
    bullets: normalizeBullets(values.bullets),
  }
}

export function experienceRecordToFormValues(entry: CvExperienceRecord): CvExperienceEntryInput {
  return {
    company_name: entry.company_name,
    company_city: entry.company_city ?? '',
    company_country: entry.company_country ?? '',
    job_title: entry.job_title,
    employment_type: entry.employment_type ?? '',
    start_month: entry.start_month,
    start_year: entry.start_year,
    end_month: entry.end_month,
    end_year: entry.end_year,
    is_current: entry.is_current,
    bullets: entry.bullets.length > 0 ? entry.bullets : [''],
    sort_order: entry.sort_order,
  }
}
