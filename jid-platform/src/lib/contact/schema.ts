import { z } from 'zod'
import { CONTACT_CATEGORIES } from '@/lib/contact/constants'
import { bilingualNameSchema } from '@/lib/utils/validators'

/** Section 9.1 — contact form validation (messages are i18n keys). */
export const contactFormSchema = z.object({
  full_name: bilingualNameSchema,
  email: z.string().trim().email({ message: 'contactPage.validation.emailInvalid' }),
  category: z.enum(CONTACT_CATEGORIES, {
    errorMap: () => ({ message: 'contactPage.validation.categoryRequired' }),
  }),
  subject: z.string().trim().min(3, { message: 'contactPage.validation.subjectMin' }),
  body: z
    .string()
    .trim()
    .min(20, { message: 'contactPage.validation.bodyMin' })
    .max(5000, { message: 'contactPage.validation.bodyMax' }),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>

export function formatContactSubject(category: ContactFormValues['category'], subject: string): string {
  return `[${category}] ${subject.trim()}`
}
