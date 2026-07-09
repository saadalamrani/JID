import type { AdditionalCategory, CvAdditionalData, CvData } from '@/types/cv'

/** Harvard Prompt 1 section order — Leadership & Activities bucket. */
export const LEADERSHIP_ACTIVITY_CATEGORIES = [
  'leadership',
  'volunteer',
  'project',
] as const satisfies readonly AdditionalCategory[]

/** Skills & Interests bucket (certifications, awards, publications, misc). */
export const SKILLS_INTEREST_CATEGORIES = [
  'certification',
  'award',
  'publication',
  'other',
] as const satisfies readonly AdditionalCategory[]

export function partitionAdditionalForHarvard(additional: CvAdditionalData[]) {
  const leadership: CvAdditionalData[] = []
  const interests: CvAdditionalData[] = []

  for (const item of additional) {
    if ((LEADERSHIP_ACTIVITY_CATEGORIES as readonly string[]).includes(item.category)) {
      leadership.push(item)
    } else if ((SKILLS_INTEREST_CATEGORIES as readonly string[]).includes(item.category)) {
      interests.push(item)
    }
  }

  return { leadership, interests }
}

export function hasHarvardBodyContent(data: CvData): boolean {
  return (
    data.education.length > 0 ||
    data.experience.length > 0 ||
    data.additional.length > 0 ||
    data.technical_skills.length > 0 ||
    data.languages.length > 0 ||
    data.skills.length > 0
  )
}
