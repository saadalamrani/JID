import { z } from 'zod'

export const workshopUpsertSchema = z.object({
  title: z.string().trim().min(3, 'العنوان قصير جداً').max(120),
  title_ar: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  scheduled_at: z.string().datetime({ message: 'موعد الورشة غير صالح' }),
  capacity: z.number().int().min(1).max(500).default(20),
  external_url: z.string().trim().url('رابط غير صالح').optional().or(z.literal('')),
  status: z.enum(['draft', 'published']).default('draft'),
})

export type WorkshopUpsertInput = z.infer<typeof workshopUpsertSchema>

export const workshopPatchSchema = workshopUpsertSchema.partial().extend({
  status: z.enum(['draft', 'published', 'completed', 'cancelled']).optional(),
  spots_remaining: z.number().int().min(0).optional(),
})

export type WorkshopPatchInput = z.infer<typeof workshopPatchSchema>

export function assertFutureScheduledAt(scheduledAt: string): void {
  const when = new Date(scheduledAt)
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    throw new Error('FUTURE_SCHEDULE_REQUIRED')
  }
}
