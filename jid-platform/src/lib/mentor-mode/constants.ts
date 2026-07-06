/** Section 4.1 — profile mode cookie (server-readable, not localStorage). */
export const PROFILE_MODE_COOKIE = 'jid_profile_mode'

export const PROFILE_MODES = ['mentee', 'mentor'] as const
export type ProfileMode = (typeof PROFILE_MODES)[number]

export function parseProfileMode(value: string | undefined | null): ProfileMode {
  return value === 'mentor' ? 'mentor' : 'mentee'
}
