import type { ProfileRecord } from './types'
import {
  calculateWizardCompletionPct,
  type WizardCompletionInput,
} from './wizard-completion'

export type ProfileDisplayState = 'empty' | 'incomplete' | 'complete'

export function toWizardInput(
  profile: ProfileRecord,
  skillCount: number,
): WizardCompletionInput {
  return {
    avatar_url: profile.avatar_url,
    headline: profile.headline,
    about_me: profile.about_me,
    university_id: profile.university_id,
    college_id: profile.college_id,
    skill_count: skillCount,
    target_sectors: profile.target_sectors,
    linkedin_url: profile.linkedin_url,
    smart_links: profile.smart_links,
  }
}

/** Section 6.3 — drives CompletionWizard / CompletionBanner / PublicContentSection. */
export function resolveProfileDisplayState(
  profile: ProfileRecord,
  skillCount: number,
): ProfileDisplayState {
  const pct = calculateWizardCompletionPct(toWizardInput(profile, skillCount))
  if (pct === 0) return 'empty'
  if (pct < 100) return 'incomplete'
  return 'complete'
}
