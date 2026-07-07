import { z } from 'zod'

const CURRENT_YEAR = new Date().getFullYear()

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
