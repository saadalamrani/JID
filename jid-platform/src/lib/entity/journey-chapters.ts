import type { EntityWizardStep } from '@/lib/entity/constants'

/** Visible institutional setup chapters (UX chrome — not backend states). */
export const INSTITUTIONAL_JOURNEY_CHAPTERS = ['identify', 'verify', 'prepare'] as const

export type InstitutionalJourneyChapter = (typeof INSTITUTIONAL_JOURNEY_CHAPTERS)[number]

/**
 * Map internal wizard steps onto the three product chapters.
 * Account → Identify; email + organization/representative details → Verify.
 * Prepare is never active inside the signup wizard (post-approval only).
 */
export function mapWizardStepToJourneyChapter(
  step: EntityWizardStep,
): InstitutionalJourneyChapter {
  if (step === 'account') return 'identify'
  return 'verify'
}
