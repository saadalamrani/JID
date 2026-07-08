import { z } from 'zod'
import { bilingualNameSchema, strongPasswordSchema } from '@/lib/utils/validators'

export const inviteStaffSchema = z.object({
  email: z.string().trim().email({ message: 'sys.validation.emailInvalid' }),
  reason: z
    .string()
    .trim()
    .min(3, { message: 'sys.validation.reasonMin' }),
})

export type InviteStaffFormValues = z.infer<typeof inviteStaffSchema>

export const acceptInviteSchema = z.object({
  full_name: bilingualNameSchema,
  password: strongPasswordSchema,
})

export type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>
