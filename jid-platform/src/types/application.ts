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

/** Section 5.2 — triage filter tabs. */
export const TRIAGE_FILTER_TABS = [
  'all',
  'under_review',
  'interview',
  'accepted',
  'rejected',
] as const
export type TriageFilterTab = (typeof TRIAGE_FILTER_TABS)[number]

export const TRIAGE_FILTER_TAB_LABELS: Record<TriageFilterTab, string> = {
  all: 'الكل',
  under_review: 'قيد المراجعة',
  interview: 'مقابلة',
  accepted: 'مقبول',
  rejected: 'مرفوض',
}

export function triageTabToStatuses(tab: TriageFilterTab): ApplicationStatus[] | null {
  switch (tab) {
    case 'all':
      return null
    case 'under_review':
      return ['submitted', 'under_review']
    case 'interview':
      return ['invited']
    case 'accepted':
      return ['shortlisted']
    case 'rejected':
      return ['rejected']
    default:
      return null
  }
}

export const TRIAGE_BULK_ACTIONS = ['accept', 'reject', 'interview'] as const
export type TriageBulkAction = (typeof TRIAGE_BULK_ACTIONS)[number]

export function triageActionToStatus(action: TriageBulkAction): ApplicationStatus {
  switch (action) {
    case 'accept':
      return 'shortlisted'
    case 'reject':
      return 'rejected'
    case 'interview':
      return 'invited'
  }
}

export type TriageApplicantProfile = {
  id: string
  full_name: string | null
  headline: string | null
  avatar_url: string | null
  /** Section 5.3 spec name — SSOT is profiles.show_profile_to_companies (048). */
  show_profile_to_recruiters: boolean
}

export type TriageApplicant = {
  id: string
  applicant_id: string
  status: ApplicationStatus
  contact_email: string | null
  submitted_at: string | null
  last_company_action_at: string | null
  applicant: TriageApplicantProfile | null
}

export type JobTriageHeader = {
  id: string
  title_ar: string
  title_en: string | null
  application_deadline: string
  daysUntilClose: number
  applicantCount: number
  acceptedCount: number
}

export type JobApplicantsResult = {
  job: JobTriageHeader
  applicants: TriageApplicant[]
}
