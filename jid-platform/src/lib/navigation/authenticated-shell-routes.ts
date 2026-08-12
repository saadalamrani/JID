/**
 * Routes wrapped by `(public)/layout.tsx` — PublicNav already renders SmartHeader.
 * Must stay complete: any public-prefix omission yields duplicate platform headers
 * for authenticated users (PublicNav + AuthenticatedAppShell).
 *
 * `/company/*` and `/university/*` intentionally keep AuthenticatedAppShell chrome
 * so organization actors retain notifications + account + actor-aware primary nav.
 *
 * Note: owner workspace `/profile`, `/profile/edit`, `/profile/cv` are NOT public —
 * only `/profile/:publicId` is under `(public)/layout.tsx` (see `isPublicProfilePath`).
 */
export const PUBLIC_SHELL_PREFIXES = [
  '/opportunities',
  '/catalog',
  '/mentors',
  '/pulse',
  '/universities',
  '/companies',
  '/plus',
  '/u',
  '/maintenance',
  '/privacy',
  '/terms',
  '/pdpl',
  '/contact',
  '/about',
] as const

const PORTAL_PREFIXES = ['/staff', '/sys', '/login', '/signup', '/forgot-password', '/reset-password']

/** Section 10 onboarding shell — dedicated layout, no portal top bar. */
const ONBOARDING_SHELL_PREFIXES = ['/welcome', '/individual', '/company/entity']

const OWNER_PROFILE_SEGMENTS = new Set(['edit', 'cv'])

/** Public individual projection: `/profile/:id` (not owner `/profile` workspace). */
export function isPublicProfilePath(normalizedPath: string): boolean {
  if (!normalizedPath.startsWith('/profile/')) return false
  const segment = normalizedPath.slice('/profile/'.length).split('/')[0] ?? ''
  if (!segment || OWNER_PROFILE_SEGMENTS.has(segment)) return false
  return true
}

export function shouldHideAuthenticatedTopBar(pathname: string): boolean {
  const normalized = pathname.replace(/^\/(ar|en)/, '') || '/'
  if (normalized === '/' || normalized === '') return true
  if (
    PORTAL_PREFIXES.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
    )
  ) {
    return true
  }
  if (
    ONBOARDING_SHELL_PREFIXES.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
    )
  ) {
    return true
  }
  if (isPublicProfilePath(normalized)) return true
  return PUBLIC_SHELL_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
}
