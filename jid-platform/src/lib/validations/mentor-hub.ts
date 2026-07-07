import { z } from 'zod'
import { MENTOR_MEDIUM_OPTIONS } from '@/lib/mentor-application/constants'

const mediumValues = MENTOR_MEDIUM_OPTIONS.map((item) => item.value) as [string, ...string[]]

export const reviewMentorRequestSchema = z
  .object({
    decision: z.enum(['accept', 'decline']),
    decline_reason: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === 'decline' && !data.decline_reason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'سبب الرفض مطلوب',
        path: ['decline_reason'],
      })
    }
  })

export type ReviewMentorRequestInput = z.infer<typeof reviewMentorRequestSchema>

export const mentorHubSettingsSchema = z.object({
  is_accepting_requests: z.boolean().optional(),
  bio_long: z.string().trim().max(5000).optional().nullable(),
  expertise_areas: z.array(z.string().trim().min(1)).max(5).optional(),
  preferred_mediums: z.array(z.enum(mediumValues)).optional(),
  finalize_mentor_setup: z.boolean().optional(),
})

export type MentorHubSettingsInput = z.infer<typeof mentorHubSettingsSchema>
