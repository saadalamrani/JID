import type { UserRole } from '@/lib/auth/rbac'

export const SYS_USERS_PAGE_SIZE = 25

export type SysUserStatusFilter = 'all' | 'active' | 'suspended'

/** Section 8.1 — includes mentor pseudo-role (mentor_profiles, not user_role_enum). */
export type SysUserRoleFilter =
  | 'all'
  | 'individual'
  | 'mentor'
  | UserRole

export type SysUsersSortField = 'full_name' | 'role' | 'created_at' | 'last_login_at' | 'status'

export type SysUsersListFilters = {
  q?: string
  role?: SysUserRoleFilter
  status?: SysUserStatusFilter
  page?: number
  sort?: SysUsersSortField
  dir?: 'asc' | 'desc'
}

export type SysUserListRow = {
  id: string
  full_name: string | null
  role: UserRole
  display_role: string
  is_suspended: boolean
  created_at: string
  last_login_at: string | null
  email: string | null
}

export type SysUsersListResult = {
  rows: SysUserListRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type SysUserDetail = {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  display_role: string
  phone: string | null
  locale: string
  avatar_url: string | null
  mfa_enabled: boolean
  mfa_enforced: boolean
  email_verified_at: string | null
  phone_verified_at: string | null
  failed_login_count: number
  locked_until: string | null
  suspended_at: string | null
  suspended_reason: string | null
  last_login_at: string | null
  last_login_ip: string | null
  created_at: string
  updated_at: string
  mentor_status: string | null
}

export type SysUserSessionRow = {
  id: string
  device_label: string | null
  ip_address: string | null
  user_agent: string | null
  last_active_at: string
  created_at: string
  expires_at: string
  revoked_at: string | null
}

export type SysUserAuditEvent = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  actor_id: string | null
  actor_name: string | null
  created_at: string
  metadata: Record<string, unknown>
}

export const MENTOR_ROLE_BLOCKED_ERROR =
  'Mentor status is managed via mentor_profiles table — approve their application in /sys/mentor-applications instead'
