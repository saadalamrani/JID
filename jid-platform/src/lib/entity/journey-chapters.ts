import type { EntityWizardStep } from '@/lib/entity/constants'

/** Visible institutional setup chapters (UX chrome — not backend states). */
export const INSTITUTIONAL_JOURNEY_CHAPTERS = ['identify', 'verify', 'prepare'] as const

export type InstitutionalJourneyChapter = (typeof INSTITUTIONAL_JOURNEY_CHAPTERS)[number]

export type EntityWizardPhase = 'selection' | 'claim'

/**
 * Map internal wizard steps onto the three product chapters.
 * Account + org selection → Identify; verification + email → Verify.
 * Prepare is never active inside the signup wizard (post-approval only).
 * Pending is an outcome, not a chapter.
 */
export function mapWizardStepToJourneyChapter(
  step: EntityWizardStep,
  entityPhase: EntityWizardPhase = 'selection',
): InstitutionalJourneyChapter {
  if (step === 'verify_email') return 'verify'
  if (step === 'pending') return 'verify'
  if (step === 'entity' && entityPhase === 'claim') return 'verify'
  return 'identify'
}
