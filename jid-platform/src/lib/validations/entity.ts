import { z } from 'zod'
import { bilingualNameSchema, strongPasswordSchema } from '@/lib/utils/validators'
import { normalizeDomain } from '@/lib/entity/domains'

export const entityAccountSchema = z.object({
  full_name: bilingualNameSchema,
  email: z.string().trim().email({ message: 'entity.validation.emailInvalid' }),
  password: strongPasswordSchema,
  accept_terms: z
    .boolean()
    .refine((value) => value === true, { message: 'entity.validation.acceptTerms' }),
})

export type EntityAccountFormValues = z.infer<typeof entityAccountSchema>

const organizationNameSchema = z
  .string()
  .trim()
  .min(2, { message: 'entity.validation.companyNameMin' })
  .max(120, { message: 'entity.validation.companyNameMin' })

const optionalWebsiteSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine(
    (value) => {
      if (!value) return true
      try {
        const url = new URL(value.startsWith('http') ? value : `https://${value}`)
        return Boolean(url.hostname)
      } catch {
        return false
      }
    },
    { message: 'entity.validation.websiteInvalid' },
  )

const optionalDomainSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine(
    (value) => {
      if (!value) return true
      const domain = normalizeDomain(value)
      return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(domain)
    },
    { message: 'entity.validation.domainsInvalid' },
  )

export const organizationRegistrationSchema = z.object({
  organization_name: organizationNameSchema,
  organization_name_ar: z.string().trim().optional().or(z.literal('')),
  website: optionalWebsiteSchema,
  domain: optionalDomainSchema,
  business_email: z.string().trim().email({ message: 'entity.validation.emailInvalid' }),
  representative_name: bilingualNameSchema,
  representative_title: z.string().trim().min(2, { message: 'entity.validation.claimantTitleMin' }),
})

export type OrganizationRegistrationFormValues = z.infer<typeof organizationRegistrationSchema>
