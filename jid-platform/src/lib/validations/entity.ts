import { z } from 'zod'
import { bilingualNameSchema, strongPasswordSchema } from '@/lib/utils/validators'
import { parseDomainsInput } from '@/lib/entity/domains'

export const entityAccountSchema = z.object({
  full_name: bilingualNameSchema,
  email: z.string().trim().email({ message: 'entity.validation.emailInvalid' }),
  password: strongPasswordSchema,
  accept_terms: z
    .boolean()
    .refine((value) => value === true, { message: 'entity.validation.acceptTerms' }),
})

export type EntityAccountFormValues = z.infer<typeof entityAccountSchema>

export const newCompanySchema = z.object({
  name: bilingualNameSchema,
  name_ar: bilingualNameSchema,
  domains: z
    .string()
    .trim()
    .min(1, { message: 'entity.validation.domainsRequired' })
    .refine((value) => parseDomainsInput(value).length > 0, {
      message: 'entity.validation.domainsInvalid',
    }),
})

export type NewCompanyFormValues = z.infer<typeof newCompanySchema>

export const claimSubmissionSchema = z.object({
  business_email: z.string().trim().email({ message: 'entity.validation.emailInvalid' }),
  claimant_name: bilingualNameSchema,
  claimant_title: z.string().trim().min(2, { message: 'entity.validation.claimantTitleMin' }),
})

export type ClaimSubmissionFormValues = z.infer<typeof claimSubmissionSchema>
