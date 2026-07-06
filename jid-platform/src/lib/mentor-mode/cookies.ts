import { PROFILE_MODE_COOKIE, parseProfileMode, type ProfileMode } from './constants'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/** Client — read profile mode from document.cookie. */
export function readProfileModeCookie(): ProfileMode {
  if (typeof document === 'undefined') return 'mentee'
  const match = document.cookie.match(new RegExp(`(?:^|; )${PROFILE_MODE_COOKIE}=([^;]*)`))
  return parseProfileMode(match?.[1] ? decodeURIComponent(match[1]) : null)
}

/** Client — persist profile mode for server layout reads. */
export function writeProfileModeCookie(mode: ProfileMode): void {
  if (typeof document === 'undefined') return
  document.cookie = `${PROFILE_MODE_COOKIE}=${encodeURIComponent(mode)}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`
}

/** Server — read profile mode in RSC / layout. */
export function getProfileModeFromCookies(
  cookieStore: { get: (name: string) => { value: string } | undefined },
): ProfileMode {
  return parseProfileMode(cookieStore.get(PROFILE_MODE_COOKIE)?.value)
}
