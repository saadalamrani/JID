import { z } from 'zod'

const optionalUrl = z
  .string()
  .trim()
  .url({ message: 'onboarding.entity.validation.urlInvalid' })
  .optional()
  .or(z.literal(''))

export const entitySetupSchema = z.object({
  logo_url: optionalUrl,
  cover_url: optionalUrl,
  description_ar: z.string().trim().max(4000).optional().or(z.literal('')),
  description_en: z.string().trim().max(4000).optional().or(z.literal('')),
})

export type EntitySetupValues = z.infer<typeof entitySetupSchema>

const teamEmailSchema = z
  .string()
  .trim()
  .email({ message: 'onboarding.entity.validation.emailInvalid' })

export const entityTeamInvitesSchema = z.object({
  invites: z
    .array(teamEmailSchema)
    .max(3, { message: 'onboarding.entity.validation.invitesMax' })
    .default([]),
})

export type EntityTeamInvitesValues = z.infer<typeof entityTeamInvitesSchema>
