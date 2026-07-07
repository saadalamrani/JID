import { z } from 'zod'

export const ANNOUNCEMENT_CATEGORIES = [
  'jobs',
  'mentorship',
  'events',
  'platform',
  'community',
] as const

export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number]

export const announcementCategorySchema = z.enum(ANNOUNCEMENT_CATEGORIES)

/** Section 8 — wizard payload with strict title/date requirements. */
export const announcementSchema = z
  .object({
    title_ar: z.string().trim().min(10, 'Title must be at least 10 characters').max(120, 'Title must be at most 120 characters'),
    body_ar: z.string().trim().max(500, 'Body must be at most 500 characters').optional().or(z.literal('')),
    category: announcementCategorySchema,
    starts_at: z.string().min(1, 'Start date is required'),
    expires_at: z.string().min(1, 'Expiry date is required'),
    cta_url: z.string().trim().url('CTA URL must be valid').optional().or(z.literal('')),
    cta_label_ar: z.string().trim().max(30, 'CTA label must be at most 30 characters').optional().or(z.literal('')),
    is_featured: z.boolean(),
    is_published: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const starts = new Date(data.starts_at)
    const expires = new Date(data.expires_at)

    if (Number.isNaN(starts.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['starts_at'], message: 'Start date is invalid' })
    }
    if (Number.isNaN(expires.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['expires_at'], message: 'Expiry date is required' })
      return
    }
    if (expires.getTime() <= Date.now()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['expires_at'], message: 'Expiry date must be in the future' })
    }
    if (!Number.isNaN(starts.getTime()) && expires <= starts) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['expires_at'], message: 'Expiry must be after start date' })
    }
  })

export type AnnouncementInput = z.infer<typeof announcementSchema>

export function defaultAnnouncementValues(): AnnouncementInput {
  const starts = new Date()
  const expires = new Date(starts.getTime() + 7 * 24 * 60 * 60 * 1000)
  return {
    title_ar: '',
    body_ar: '',
    category: 'platform',
    starts_at: starts.toISOString(),
    expires_at: expires.toISOString(),
    cta_url: '',
    cta_label_ar: '',
    is_featured: false,
    is_published: false,
  }
}

export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDatetimeLocalValue(value: string): string {
  if (!value) return ''
  return new Date(value).toISOString()
}
