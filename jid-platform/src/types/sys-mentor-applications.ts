export const SYS_MENTOR_APPLICATIONS_PAGE_SIZE = 25

export type SysMentorStatusFilter =
  | 'all'
  | 'pending_review'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'suspended'

export type SysMentorApplicationsFilters = {
  q?: string
  status?: SysMentorStatusFilter
  page?: number
}

export type SysMentorApplicationRow = {
  user_id: string
  status: string
  headline: string | null
  application_submitted_at: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  applicant_name: string | null
  applicant_avatar_url: string | null
  expertise_areas: string[]
}

export type SysMentorApplicationsResult = {
  rows: SysMentorApplicationRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
