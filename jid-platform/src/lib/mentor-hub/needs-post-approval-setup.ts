import type { MentorHubSettings } from '@/lib/mentor-hub/queries'
import { parseMentorSetupMeta } from '@/lib/onboarding/entity-smart-links'

/** Task 3 — show post-approval mentor setup when expertise/mediums are not finalized. */
export function needsMentorPostApprovalSetup(
  settings: MentorHubSettings,
  smartLinks: Record<string, unknown> | null | undefined,
): boolean {
  const mentorSetup = parseMentorSetupMeta(smartLinks)
  if (mentorSetup.completed_at) {
    return false
  }

  const missingExpertise = settings.expertise_areas.length === 0
  const missingMediums = settings.preferred_mediums.length === 0
  return missingExpertise || missingMediums
}
