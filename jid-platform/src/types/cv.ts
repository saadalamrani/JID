/**
 * CV module types — reconciled with 068_cv_database.sql.
 */

export const CV_STATUSES = ['draft', 'published', 'archived'] as const
export type CvStatus = (typeof CV_STATUSES)[number]

export const ADDITIONAL_CATEGORIES = [
  'certification',
  'award',
  'leadership',
  'volunteer',
  'project',
  'publication',
  'language',
  'other',
] as const
export type AdditionalCategory = (typeof ADDITIONAL_CATEGORIES)[number]

/** Section 7.9 — additional form categories (languages use `language-editor`). */
export const BUILDER_ADDITIONAL_CATEGORIES = [
  'certification',
  'award',
  'leadership',
  'volunteer',
  'project',
  'publication',
] as const satisfies ReadonlyArray<AdditionalCategory>

export type BuilderAdditionalCategory = (typeof BUILDER_ADDITIONAL_CATEGORIES)[number]

export const CV_LANGUAGE_PROFICIENCY_LEVELS = [
  'native',
  'fluent',
  'professional_working',
  'conversational',
  'basic',
] as const
export type CvLanguageProficiency = (typeof CV_LANGUAGE_PROFICIENCY_LEVELS)[number]

export type CvLanguageEntry = {
  name: string
  proficiency: CvLanguageProficiency
}

export const CV_GENERATION_STATUSES = ['pending', 'completed', 'failed'] as const
export type CvGenerationStatus = (typeof CV_GENERATION_STATUSES)[number]

export type CvRecord = {
  id: string
  user_id: string
  title: string | null
  status: CvStatus
  locale: string
  is_primary: boolean
  full_name: string | null
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  custom_link_1_label: string | null
  custom_link_1_url: string | null
  custom_link_2_label: string | null
  custom_link_2_url: string | null
  summary: string | null
  template_key: string
  technical_skills: string[]
  languages: CvLanguageEntry[]
  created_at: string
  updated_at: string
}

export type CvEducationRecord = {
  id: string
  cv_id: string
  institution_name: string
  institution_city: string | null
  institution_country: string | null
  degree: string | null
  field_of_study: string | null
  graduation_year: number | null
  gpa_value: number | null
  gpa_scale: number | null
  honors: string | null
  relevant_coursework: string | null
  start_month: number | null
  start_year: number | null
  end_month: number | null
  end_year: number | null
  is_current: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type CvExperienceRecord = {
  id: string
  cv_id: string
  company_name: string
  company_city: string | null
  company_country: string | null
  job_title: string
  location: string | null
  employment_type: string | null
  start_month: number | null
  start_year: number | null
  end_month: number | null
  end_year: number | null
  is_current: boolean
  bullets: string[]
  sort_order: number
  created_at: string
  updated_at: string
}

export type CvSkillRecord = {
  id: string
  cv_id: string
  skill_name: string
  proficiency: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type CvAdditionalRecord = {
  id: string
  cv_id: string
  category: AdditionalCategory
  title: string
  issuer: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type CvGenerationRecord = {
  id: string
  cv_id: string
  user_id: string
  section: string
  prompt: string | null
  model: string | null
  status: CvGenerationStatus
  input_snapshot: Record<string, unknown>
  output_snapshot: Record<string, unknown> | null
  tokens_used: number | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

/** Full CV document with child sections (editor / export shape). */
export type CvFullRecord = CvRecord & {
  education: CvEducationRecord[]
  experience: CvExperienceRecord[]
  skills: CvSkillRecord[]
  additional: CvAdditionalRecord[]
}

/** @deprecated Use CvFullRecord */
export type CvDocument = CvFullRecord

/** PDF render input — Section 6.1 (no DB metadata). */
export type CvEducationData = {
  institution_name: string
  institution_city: string | null
  institution_country: string | null
  degree: string | null
  field_of_study: string | null
  graduation_year: number | null
  gpa_value: number | null
  gpa_scale: number | null
  honors: string | null
  relevant_coursework: string | null
  start_month: number | null
  start_year: number | null
  end_month: number | null
  end_year: number | null
  is_current: boolean
  sort_order: number
}

export type CvExperienceData = {
  company_name: string
  company_city: string | null
  company_country: string | null
  job_title: string
  location: string | null
  employment_type: string | null
  start_month: number | null
  start_year: number | null
  end_month: number | null
  end_year: number | null
  is_current: boolean
  bullets: string[]
  sort_order: number
}

export type CvSkillData = {
  skill_name: string
  proficiency: string | null
  sort_order: number
}

export type CvAdditionalData = {
  category: AdditionalCategory
  title: string
  issuer: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  url: string | null
  sort_order: number
}

export type CvData = {
  locale: 'ar' | 'en'
  full_name: string
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  custom_link_1_label: string | null
  custom_link_1_url: string | null
  custom_link_2_label: string | null
  custom_link_2_url: string | null
  summary: string | null
  technical_skills: string[]
  languages: CvLanguageEntry[]
  education: CvEducationData[]
  experience: CvExperienceData[]
  skills: CvSkillData[]
  additional: CvAdditionalData[]
}

/**
 * Profile fields Section 8 auto-fill may read — reconciled Day 1.
 * @see scripts/reconcile-profiles-for-cv.ts
 */
export type ProfileCvAutofillSource = {
  full_name: string | null
  phone: string | null
  linkedin_url: string | null
  university_id: string | null
  college_id: string | null
  target_regions: string[]
}

export function isCvStatus(value: string): value is CvStatus {
  return (CV_STATUSES as readonly string[]).includes(value)
}

export function isAdditionalCategory(value: string): value is AdditionalCategory {
  return (ADDITIONAL_CATEGORIES as readonly string[]).includes(value)
}
