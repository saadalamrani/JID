'use client'

import { useMemo } from 'react'
import type { UserApplication } from '@/types/application'

/** Section 7.6 — unseen company status change (status_changed_at vs last_seen_by_user_at). */
export function hasUnseenCompanyStatusChange(
  application: Pick<
    UserApplication,
    'status_changed_at' | 'last_seen_by_user_at' | 'status_changed_by' | 'applicant_id'
  >,
  userId: string,
): boolean {
  if (!application.status_changed_at) return false
  if (application.status_changed_by === userId) return false
  if (application.status_changed_by === application.applicant_id) return false

  if (!application.last_seen_by_user_at) return true

  return (
    new Date(application.status_changed_at).getTime() >
    new Date(application.last_seen_by_user_at).getTime()
  )
}

/** Section 7.6 — glow indicator for company-initiated status updates. */
export function useGlowState(
  application: Pick<
    UserApplication,
    'status_changed_at' | 'last_seen_by_user_at' | 'status_changed_by' | 'applicant_id'
  >,
  userId: string,
): boolean {
  return useMemo(
    () => hasUnseenCompanyStatusChange(application, userId),
    [
      application.applicant_id,
      application.last_seen_by_user_at,
      application.status_changed_at,
      application.status_changed_by,
      userId,
    ],
  )
}
