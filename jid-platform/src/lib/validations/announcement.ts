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

/** Base object before schedule refinements (supports .pick() in wizard steps). */
export const announcementFormBaseSchema = z.object({
  title_ar: z
    .string()
    .trim()
    .min(10, { message: 'staff.announcements.validation.titleMin' })
    .max(120, { message: 'staff.announcements.validation.titleMax' }),
  body_ar: z
    .string()
    .trim()
    .max(500, { message: 'staff.announcements.validation.bodyMax' })
    .optional()
    .or(z.literal('')),
  category: announcementCategorySchema,
  starts_at: z.string().min(1, { message: 'staff.announcements.validation.startsRequired' }),
  expires_at: z.string().min(1, { message: 'staff.announcements.validation.expiresRequired' }),
  cta_url: z
    .string()
    .trim()
    .url({ message: 'staff.announcements.validation.ctaUrlInvalid' })
    .optional()
    .or(z.literal('')),
  cta_label_ar: z
    .string()
    .trim()
    .max(30, { message: 'staff.announcements.validation.ctaLabelMax' })
    .optional()
    .or(z.literal('')),
  is_featured: z.boolean(),
  is_published: z.boolean(),
})

/** Section 8 — announcement wizard schema (Category → Content → Schedule). */
export const announcementFormSchema = announcementFormBaseSchema.superRefine((data, ctx) => {
    const starts = new Date(data.starts_at)
    const expires = new Date(data.expires_at)

    if (Number.isNaN(starts.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'staff.announcements.validation.startsInvalid',
        path: ['starts_at'],
      })
    }

    if (Number.isNaN(expires.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'staff.announcements.validation.expiresRequired',
        path: ['expires_at'],
      })
      return
    }

    if (expires.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'staff.announcements.validation.expiresFuture',
        path: ['expires_at'],
      })
    }

    if (!Number.isNaN(starts.getTime()) && expires <= starts) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'staff.announcements.validation.expiresAfterStart',
        path: ['expires_at'],
      })
    }
  })

export type AnnouncementFormInput = z.infer<typeof announcementFormBaseSchema>

export function defaultAnnouncementFormValues(): AnnouncementFormInput {
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
