const LOCALE_PREFIX = '(?:/(?:ar|en))?'

/** True for `/staff/login` and `/staff/mfa` (with optional locale prefix). */
export function isStaffAuthRoute(pathname: string): boolean {
  return new RegExp(`^${LOCALE_PREFIX}/staff/(login|mfa)(?:/|$)`).test(pathname)
}

/** True for protected staff routes (not login/mfa/accept-invite). */
export function isStaffProtectedRoute(pathname: string): boolean {
  if (!new RegExp(`^${LOCALE_PREFIX}/staff(?:/|$)`).test(pathname)) {
    return false
  }
  if (isStaffAuthRoute(pathname)) return false
  if (new RegExp(`^${LOCALE_PREFIX}/staff/accept-invite(?:/|$)`).test(pathname)) {
    return false
  }
  return true
}

export function sanitizeStaffNextPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null
  if (!path.startsWith('/staff')) return null
  if (path.startsWith('/staff/login') || path.startsWith('/staff/mfa')) return null
  if (path.startsWith('/staff/accept-invite')) return null
  return path
}
