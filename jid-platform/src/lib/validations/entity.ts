import { z } from 'zod'
import { PASSWORD_REGEX } from '@/lib/validations/auth'
import { parseDomainsInput } from '@/lib/entity/domains'

export const entityAccountSchema = z.object({
  full_name: z.string().trim().min(2, { message: 'entity.validation.fullNameMin' }),
  email: z.string().trim().email({ message: 'entity.validation.emailInvalid' }),
  password: z.string().regex(PASSWORD_REGEX, { message: 'entity.validation.passwordWeak' }),
  accept_terms: z
    .boolean()
    .refine((value) => value === true, { message: 'entity.validation.acceptTerms' }),
})

export type EntityAccountFormValues = z.infer<typeof entityAccountSchema>

export const newCompanySchema = z.object({
  name: z.string().trim().min(2, { message: 'entity.validation.companyNameMin' }),
  name_ar: z.string().trim().min(2, { message: 'entity.validation.companyNameArMin' }),
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
  claimant_name: z.string().trim().min(2, { message: 'entity.validation.claimantNameMin' }),
  claimant_title: z.string().trim().min(2, { message: 'entity.validation.claimantTitleMin' }),
})

export type ClaimSubmissionFormValues = z.infer<typeof claimSubmissionSchema>
