/**
 * Application types — reconciled Day 1 schema (048).
 */

export const APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'shortlisted',
  'rejected',
  'invited',
  'withdrawn',
  'expired',
] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'مسودة',
  submitted: 'مُرسل',
  under_review: 'قيد المراجعة',
  shortlisted: 'في القائمة المختصرة',
  rejected: 'مرفوض',
  invited: 'مدعو',
  withdrawn: 'منسحب',
  expired: 'منتهٍ',
}

export type ApplicationJobRef = {
  id: string
  slug: string | null
  title_ar: string
  title_en: string | null
  application_deadline: string
}

export type ApplicationCompanyRef = {
  id: string
  slug: string | null
  name_en: string
  name_ar: string | null
  logo_url: string | null
}

/** Radar-ready application row for the signed-in user. */
export type UserApplication = {
  id: string
  job_id: string
  applicant_id: string
  company_id: string
  status: ApplicationStatus
  cover_letter: string | null
  resume_url: string | null
  contact_email: string | null
  submitted_at: string | null
  last_company_action_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  job: ApplicationJobRef | null
  company: ApplicationCompanyRef | null
}

export type UserApplicationsResult = {
  applications: UserApplication[]
  count: number
}

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value)
}
