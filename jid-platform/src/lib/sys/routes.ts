const LOCALE_PREFIX = '(?:/(?:ar|en))?'

/** True for `/sys/login` and `/sys/mfa` (with optional locale prefix). */
export function isSysAuthRoute(pathname: string): boolean {
  return new RegExp(`^${LOCALE_PREFIX}/sys/(login|mfa)(?:/|$)`).test(pathname)
}

/** True for protected super-admin routes (not login/mfa). */
export function isSysProtectedRoute(pathname: string): boolean {
  if (!new RegExp(`^${LOCALE_PREFIX}/sys(?:/|$)`).test(pathname)) {
    return false
  }
  return !isSysAuthRoute(pathname)
}

export function sanitizeSysNextPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null
  if (!path.startsWith('/sys')) return null
  if (path.startsWith('/sys/login') || path.startsWith('/sys/mfa')) return null
  return path
}
