import { z } from 'zod'
import { CV_YEAR_MAX, CV_YEAR_MIN } from '@/lib/cv/constants'
import type { CvEducationRecord } from '@/types/cv'

const monthSchema = z
  .number()
  .int()
  .min(1, 'الشهر غير صالح')
  .max(12, 'الشهر غير صالح')
  .nullable()

const yearSchema = z
  .number()
  .int()
  .min(CV_YEAR_MIN, 'السنة غير صالحة')
  .max(CV_YEAR_MAX, 'السنة غير صالحة')
  .nullable()

const gpaValueSchema = z
  .number()
  .min(0, 'المعدل لا يمكن أن يكون سالباً')
  .max(100, 'المعدل مرتفع جداً')
  .nullable()

const gpaScaleSchema = z
  .number()
  .positive('مقياس المعدل يجب أن يكون أكبر من صفر')
  .max(100, 'مقياس المعدل مرتفع جداً')
  .nullable()

function numberFromInput(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

const monthFromInput = z.preprocess(numberFromInput, monthSchema)
const yearFromInput = z.preprocess(numberFromInput, yearSchema)
const gpaValueFromInput = z.preprocess(numberFromInput, gpaValueSchema)
const gpaScaleFromInput = z.preprocess(numberFromInput, gpaScaleSchema)

const educationEntryBase = {
  institution_name: z.string().trim().min(1, 'اسم المؤسسة مطلوب').max(200),
  institution_city: z.string().trim().max(80).optional().or(z.literal('')),
  institution_country: z.string().trim().max(80).optional().or(z.literal('')),
  degree: z.string().trim().max(120).optional().or(z.literal('')),
  field_of_study: z.string().trim().max(120).optional().or(z.literal('')),
  graduation_year: yearFromInput,
  gpa_value: gpaValueFromInput,
  gpa_scale: gpaScaleFromInput,
  honors: z.string().trim().max(120).optional().or(z.literal('')),
  relevant_coursework: z.string().trim().max(2000).optional().or(z.literal('')),
  start_month: monthFromInput,
  start_year: yearFromInput,
  end_month: monthFromInput,
  end_year: yearFromInput,
  is_current: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
}

function refineEducationDates<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data, ctx) => {
    const entry = data as {
      gpa_value: number | null
      gpa_scale: number | null
      is_current: boolean
      end_month: number | null
      end_year: number | null
    }

    if (entry.gpa_value != null && entry.gpa_scale != null && entry.gpa_value > entry.gpa_scale) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'المعدل لا يمكن أن يتجاوز المقياس',
        path: ['gpa_value'],
      })
    }

    if (entry.is_current && (entry.end_month != null || entry.end_year != null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'أزل تاريخ الانتهاء عند اختيار «أدرس حالياً»',
        path: ['is_current'],
      })
    }
  })
}

/** Section 7.7 — single education entry (form + API). */
const cvEducationEntryObjectSchema = z.object(educationEntryBase)

export const cvEducationEntrySchema = refineEducationDates(cvEducationEntryObjectSchema)

export type CvEducationEntryInput = z.infer<typeof cvEducationEntrySchema>

export const cvEducationListSchema = z
  .array(cvEducationEntrySchema)
  .max(10, 'الحد الأقصى 10 إدخالات تعليمية')

export type CvEducationListInput = z.infer<typeof cvEducationListSchema>

export const cvEducationCreateSchema = cvEducationEntryObjectSchema.pick({
  institution_name: true,
  sort_order: true,
})

const dbNullableString = z.union([z.string(), z.null()]).optional()
const dbNullableNumber = z.union([z.number(), z.null()]).optional()

/** PATCH body — accepts null to clear optional fields. */
export const cvEducationDbUpdateSchema = z
  .object({
    institution_name: z.string().trim().min(1, 'اسم المؤسسة مطلوب').max(200).optional(),
    institution_city: dbNullableString,
    institution_country: dbNullableString,
    degree: dbNullableString,
    field_of_study: dbNullableString,
    graduation_year: dbNullableNumber,
    gpa_value: dbNullableNumber,
    gpa_scale: dbNullableNumber,
    honors: dbNullableString,
    relevant_coursework: dbNullableString,
    start_month: dbNullableNumber,
    start_year: dbNullableNumber,
    end_month: dbNullableNumber,
    end_year: dbNullableNumber,
    is_current: z.boolean().optional(),
  })
  .strict()

export type CvEducationUpdateInput = z.infer<typeof cvEducationDbUpdateSchema>

export const cvEducationReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
})

export type CvEducationDbPatch = {
  institution_name?: string
  institution_city?: string | null
  institution_country?: string | null
  degree?: string | null
  field_of_study?: string | null
  graduation_year?: number | null
  gpa_value?: number | null
  gpa_scale?: number | null
  honors?: string | null
  relevant_coursework?: string | null
  start_month?: number | null
  start_year?: number | null
  end_month?: number | null
  end_year?: number | null
  is_current?: boolean
  sort_order?: number
}

function emptyStringToNull(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function normalizeEducationUpdate(values: CvEducationEntryInput): CvEducationDbPatch {
  return {
    institution_name: values.institution_name.trim(),
    institution_city: emptyStringToNull(values.institution_city),
    institution_country: emptyStringToNull(values.institution_country),
    degree: emptyStringToNull(values.degree),
    field_of_study: emptyStringToNull(values.field_of_study),
    graduation_year: values.graduation_year,
    gpa_value: values.gpa_value,
    gpa_scale: values.gpa_scale,
    honors: emptyStringToNull(values.honors),
    relevant_coursework: emptyStringToNull(values.relevant_coursework),
    start_month: values.start_month,
    start_year: values.start_year,
    end_month: values.is_current ? null : values.end_month,
    end_year: values.is_current ? null : values.end_year,
    is_current: values.is_current,
  }
}

export function educationRecordToFormValues(entry: CvEducationRecord): CvEducationEntryInput {
  return {
    institution_name: entry.institution_name,
    institution_city: entry.institution_city ?? '',
    institution_country: entry.institution_country ?? '',
    degree: entry.degree ?? '',
    field_of_study: entry.field_of_study ?? '',
    graduation_year: entry.graduation_year,
    gpa_value: entry.gpa_value,
    gpa_scale: entry.gpa_scale,
    honors: entry.honors ?? '',
    relevant_coursework: entry.relevant_coursework ?? '',
    start_month: entry.start_month,
    start_year: entry.start_year,
    end_month: entry.end_month,
    end_year: entry.end_year,
    is_current: entry.is_current,
    sort_order: entry.sort_order,
  }
}
