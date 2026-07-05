import { z } from 'zod'
import type { WizardTaskId } from '@/lib/profile/wizard-completion'

const officeLocationSchema = z.object({
  city: z.string().trim().min(1),
  region: z.string().trim().optional(),
  address: z.string().trim().optional(),
})

const careerEntrySchema = z.object({
  title: z.string().trim().min(1),
  company: z.string().trim().optional(),
  start_year: z.coerce.number().int().min(1950).max(2100).optional(),
  end_year: z.coerce.number().int().min(1950).max(2100).nullable().optional(),
  description: z.string().trim().optional(),
})

export const individualProfileEditSchema = z.object({
  avatar_url: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || z.string().url().safeParse(v).success, { message: 'Invalid URL' }),
  headline: z.string().trim().max(120).optional().or(z.literal('')),
  about_me: z.string().trim().max(500).optional().or(z.literal('')),
  target_sectors: z.array(z.string().trim().min(1)).max(3),
  target_program_types: z.array(z.string().trim().min(1)),
  target_regions: z.array(z.string().trim().min(1)),
  linkedin_url: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || z.string().url().safeParse(v).success, { message: 'Invalid URL' }),
  smart_links: z.object({
    linkedin: z.string().trim().optional(),
    github: z.string().trim().optional(),
    portfolio: z.string().trim().optional(),
    custom: z.string().trim().optional(),
  }),
  skill_ids: z.array(z.string().uuid()),
})

export type IndividualProfileEditValues = z.infer<typeof individualProfileEditSchema>

export const individualPrivacySchema = z.object({
  visibility: z.enum(['private', 'discoverable']),
  show_profile_to_companies: z.boolean(),
  show_profile_in_university_stats: z.boolean(),
})

export type IndividualPrivacyValues = z.infer<typeof individualPrivacySchema>

export const companyProfileEditSchema = z.object({
  tagline_ar: z.string().trim().max(160).optional().or(z.literal('')),
  tagline_en: z.string().trim().max(160).optional().or(z.literal('')),
  about_long_ar: z.string().trim().max(2000).optional().or(z.literal('')),
  about_long_en: z.string().trim().max(2000).optional().or(z.literal('')),
  founded_year: z.coerce.number().int().min(1800).max(2100).nullable().optional(),
  employee_count_range: z.string().trim().max(40).optional().or(z.literal('')),
  office_locations: z.array(officeLocationSchema),
})

export type CompanyProfileEditValues = z.infer<typeof companyProfileEditSchema>

export const mentorProfileEditSchema = z.object({
  bio_long: z.string().trim().max(3000).optional().or(z.literal('')),
  career_history: z.array(careerEntrySchema),
  expertise_sectors: z.array(z.string().trim().min(1)),
})

export type MentorProfileEditValues = z.infer<typeof mentorProfileEditSchema>

/** Maps completion-wizard task ids to form section element ids. */
export const WIZARD_FOCUS_SECTION_IDS: Record<WizardTaskId, string> = {
  avatar: 'field-avatar',
  headline: 'field-headline',
  about: 'field-about',
  university: 'field-university',
  skills: 'field-skills',
  targets: 'field-targets',
  links: 'field-links',
}

export function parseFocusTaskId(value: string | null | undefined): WizardTaskId | null {
  if (!value) return null
  return value in WIZARD_FOCUS_SECTION_IDS ? (value as WizardTaskId) : null
}
