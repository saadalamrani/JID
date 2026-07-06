import { z } from 'zod'
import { MENTOR_MEDIUM_OPTIONS } from '@/lib/mentor-application/constants'

const mediumValues = MENTOR_MEDIUM_OPTIONS.map((item) => item.value) as [string, ...string[]]

export const proposeMeetingSchema = z.object({
  scheduled_at: z.string().datetime({ message: 'موعد الجلسة غير صالح' }),
  duration_minutes: z
    .number()
    .int()
    .min(15, 'المدة 15 دقيقة على الأقل')
    .max(180, 'المدة 180 دقيقة كحد أقصى'),
  meeting_url: z
    .string()
    .trim()
    .url('رابط الاجتماع غير صالح')
    .optional()
    .or(z.literal('')),
  notes: z.string().trim().max(500, 'الملاحظات طويلة جداً').optional(),
  medium: z.enum(mediumValues).optional(),
}).superRefine((data, ctx) => {
  const when = new Date(data.scheduled_at)
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'يجب أن يكون موعد الجلسة في المستقبل',
      path: ['scheduled_at'],
    })
  }
})

export type ProposeMeetingInput = z.infer<typeof proposeMeetingSchema>

export const submitMeetingFeedbackSchema = z.object({
  feedback_rating: z
    .number()
    .int()
    .min(1, 'التقييم من 1 إلى 5')
    .max(5, 'التقييم من 1 إلى 5'),
  feedback_comment: z.string().trim().max(1000, 'التعليق طويل جداً').optional(),
})

export type SubmitMeetingFeedbackInput = z.infer<typeof submitMeetingFeedbackSchema>
