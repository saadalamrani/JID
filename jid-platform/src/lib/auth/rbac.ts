/**
 * JID RBAC — role types and hierarchy (Section 5 / Section 11 Step 4)
 */

export const USER_ROLES = [
  'individual',
  'entity',
  'company_admin',
  'university_admin',
  'staff',
  'admin',
  'super_admin',
] as const

export type UserRole = (typeof USER_ROLES)[number]

/** Numeric rank for hierarchy comparisons (higher = more privileged). */
export const ROLE_RANK: Record<UserRole, number> = {
  individual: 1,
  entity: 2,
  company_admin: 2,
  university_admin: 2,
  staff: 3,
  admin: 4,
  super_admin: 5,
}

export const PRIVILEGED_STAFF_ROLES: readonly UserRole[] = ['staff', 'admin', 'super_admin']

export const ADMIN_ROLES: readonly UserRole[] = ['admin', 'super_admin']

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value)
}

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minimumRole]
}

export function isRoleAllowed(userRole: UserRole, allowedRoles: readonly UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}
