import { z } from 'zod'
import { MENTOR_MEDIUM_OPTIONS } from '@/lib/mentor-application/constants'

export const INTENT_STATEMENT_MIN_LENGTH = 50

const mediumValues = MENTOR_MEDIUM_OPTIONS.map((item) => item.value) as [string, ...string[]]

export const createMentorshipRequestSchema = z.object({
  mentor_id: z.string().uuid('معرّف المرشد غير صالح'),
  intent_statement: z
    .string()
    .trim()
    .min(
      INTENT_STATEMENT_MIN_LENGTH,
      `يجب أن يكون هدف الطلب ${INTENT_STATEMENT_MIN_LENGTH} حرفاً على الأقل`,
    ),
  focus_area: z.string().trim().max(120).optional().nullable(),
  preferred_medium: z.enum(mediumValues).optional().nullable(),
})

export type CreateMentorshipRequestInput = z.infer<typeof createMentorshipRequestSchema>
