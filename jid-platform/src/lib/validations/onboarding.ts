import { z } from 'zod'
import { ARABIC_NAME_REGEX, SAUDI_PHONE_REGEX } from '@/lib/utils/validators'
import { isValidSaudiPhoneE164, normalizeSaudiPhoneE164 } from '@/lib/verification/phone'

const CURRENT_YEAR = new Date().getFullYear()

function numberFromInput(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

/** Sprint 0 — reused by onboarding step 1 (Section 11.1). */
export const arabicNameSchema = z
  .string()
  .trim()
  .min(2, { message: 'onboarding.validation.fullNameMin' })
  .regex(ARABIC_NAME_REGEX, { message: 'onboarding.validation.fullNameArabic' })

/** Sprint 0 — reused by onboarding step 1 (Section 11.1). */
export const saudiPhoneSchema = z
  .string()
  .trim()
  .min(1, { message: 'onboarding.validation.phoneRequired' })
  .refine((value) => SAUDI_PHONE_REGEX.test(value.replace(/[\s-]/g, '')), {
    message: 'onboarding.validation.phoneInvalid',
  })
  .transform((value) => normalizeSaudiPhoneE164(value))
  .refine(isValidSaudiPhoneE164, { message: 'onboarding.validation.phoneInvalid' })

export const onboardingStepOneSchema = z.object({
  full_name: arabicNameSchema,
  phone: saudiPhoneSchema,
})

export type OnboardingStepOneValues = z.infer<typeof onboardingStepOneSchema>

const gpaValueSchema = z
  .number()
  .min(0, 'onboarding.validation.gpaValueRange')
  .max(100, 'onboarding.validation.gpaValueRange')
  .nullable()

const gpaScaleSchema = z
  .number()
  .positive('onboarding.validation.gpaScalePositive')
  .max(100, 'onboarding.validation.gpaScaleRange')
  .nullable()

const gpaValueFromInput = z.preprocess(numberFromInput, gpaValueSchema.optional())
const gpaScaleFromInput = z.preprocess(numberFromInput, gpaScaleSchema.optional())

export const onboardingStepTwoSchema = z
  .object({
    university_id: z.string().uuid({ message: 'onboarding.validation.universityRequired' }),
    degree: z
      .string()
      .trim()
      .min(1, { message: 'onboarding.validation.degreeRequired' })
      .max(120, { message: 'onboarding.validation.degreeMax' }),
    graduation_year: z.coerce
      .number()
      .int()
      .min(1950, { message: 'onboarding.validation.graduationYearRange' })
      .max(CURRENT_YEAR + 10, { message: 'onboarding.validation.graduationYearRange' }),
    gpa_value: gpaValueFromInput,
    gpa_scale: gpaScaleFromInput,
  })
  .superRefine((data, ctx) => {
    if (
      data.gpa_value != null &&
      data.gpa_scale != null &&
      data.gpa_value > data.gpa_scale
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'onboarding.validation.gpaExceedsScale',
        path: ['gpa_value'],
      })
    }
  })

export type OnboardingStepTwoValues = z.infer<typeof onboardingStepTwoSchema>

export const onboardingStepThreeSchema = z
  .object({
    target_sectors: z.array(z.string().trim().min(1)).max(3).optional().default([]),
    target_job_titles: z.string().trim().max(500).optional().or(z.literal('')),
    salary_min: z.preprocess(numberFromInput, z.number().int().min(0).nullable().optional()),
    salary_max: z.preprocess(numberFromInput, z.number().int().min(0).nullable().optional()),
  })
  .superRefine((data, ctx) => {
    if (
      data.salary_min != null &&
      data.salary_max != null &&
      data.salary_min > data.salary_max
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'onboarding.validation.salaryRange',
        path: ['salary_max'],
      })
    }
  })

export type OnboardingStepThreeValues = z.infer<typeof onboardingStepThreeSchema>

export const studentStatusValues = [
  'current_student',
  'expected_graduate',
  'graduate',
  'alumni',
  'other',
] as const

export const onboardingAcademicSchema = z.object({
  university_id: z.string().uuid('اختر الجامعة'),
  college_id: z.string().uuid('اختر الكلية'),
  major_id: z.string().uuid('اختر التخصص'),
  graduation_year: z.coerce
    .number()
    .int()
    .min(1950, 'سنة التخرج غير صحيحة')
    .max(CURRENT_YEAR + 10, 'سنة التخرج غير صحيحة'),
  student_status: z.enum(studentStatusValues, { message: 'اختر الحالة الدراسية' }),
})

export const onboardingContextSchema = z.object({
  role: z.enum(['individual', 'entity', 'company_admin', 'university_admin', 'staff', 'admin', 'super_admin']),
  path: z.string(),
  academic: onboardingAcademicSchema.partial(),
})

export const onboardingSchema = onboardingContextSchema.superRefine((value, ctx) => {
  const requiresAcademic = value.role === 'individual' && value.path.includes('/me/onboarding')
  if (!requiresAcademic) return

  const check = onboardingAcademicSchema.safeParse(value.academic)
  if (check.success) return

  for (const issue of check.error.issues) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['academic', ...issue.path],
      message: issue.message,
    })
  }
})

export type OnboardingAcademicValues = z.infer<typeof onboardingAcademicSchema>
