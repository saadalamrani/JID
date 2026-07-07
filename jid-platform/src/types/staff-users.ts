import type { UserRole } from '@/lib/auth/rbac'

export const STAFF_USERS_PAGE_SIZE = 25

/** Bounded staff scope — individuals + approved mentors only (display filter). */
export const STAFF_USER_ROLE_FILTERS = ['all', 'individual', 'mentor'] as const
export type StaffUserRoleFilter = (typeof STAFF_USER_ROLE_FILTERS)[number]

export type StaffUserStatusFilter = 'all' | 'active' | 'suspended'

export type StaffUsersListFilters = {
  q?: string
  role?: StaffUserRoleFilter
  status?: StaffUserStatusFilter
  page?: number
}

export type StaffUserListRow = {
  id: string
  full_name: string | null
  display_role: 'individual' | 'mentor'
  is_suspended: boolean
  created_at: string
  last_login_at: string | null
  email: string | null
}

export type StaffUsersListResult = {
  rows: StaffUserListRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type StaffUserDetail = {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  display_role: 'individual' | 'mentor'
  phone: string | null
  locale: string
  avatar_url: string | null
  email_verified_at: string | null
  phone_verified_at: string | null
  suspended_at: string | null
  suspended_reason: string | null
  last_login_at: string | null
  last_login_ip: string | null
  created_at: string
  updated_at: string
  mentor_status: string | null
}

export type StaffUserSessionRow = {
  id: string
  device_label: string | null
  ip_address: string | null
  user_agent: string | null
  last_active_at: string
  created_at: string
  expires_at: string
  revoked_at: string | null
}

export type StaffUserAuditEvent = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  actor_id: string | null
  actor_name: string | null
  created_at: string
  metadata: Record<string, unknown>
}

/** DB roles staff may view or act on (profiles.role only — mentors stay `individual`). */
export const STAFF_MANAGEABLE_PROFILE_ROLES = ['individual'] as const

export function isStaffManageableProfileRole(role: string): boolean {
  return (STAFF_MANAGEABLE_PROFILE_ROLES as readonly string[]).includes(role)
}
