import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getProfileModeFromCookies } from '@/lib/mentor-mode/cookies'
import { hasApprovedMentorProfile } from '@/lib/mentor-mode/has-mentor-role'
import { requireMeUserId } from '@/lib/me/account'

/**
 * Section 4.9 — mentor hub requires approved mentor_profiles row AND mentor mode cookie.
 */
export async function requireMentorHubAccess(): Promise<string> {
  let userId: string
  try {
    userId = await requireMeUserId()
  } catch {
    redirect('/login')
  }

  const hasMentorRole = await hasApprovedMentorProfile(userId)
  if (!hasMentorRole) {
    redirect('/profile')
  }

  const cookieStore = await cookies()
  const mode = getProfileModeFromCookies(cookieStore)
  if (mode !== 'mentor') {
    redirect('/profile')
  }

  return userId
}
