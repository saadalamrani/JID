import { z } from 'zod'
import { PASSWORD_REGEX } from '@/lib/validations/auth'

export const inviteStaffSchema = z.object({
  email: z.string().trim().email({ message: 'sys.validation.emailInvalid' }),
  reason: z
    .string()
    .trim()
    .min(3, { message: 'sys.validation.reasonMin' }),
})

export type InviteStaffFormValues = z.infer<typeof inviteStaffSchema>

export const acceptInviteSchema = z.object({
  full_name: z.string().trim().min(2, { message: 'sys.validation.fullNameMin' }),
  password: z.string().regex(PASSWORD_REGEX, { message: 'sys.validation.passwordWeak' }),
})

export type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>
