import { BUILDER_ADDITIONAL_CATEGORIES } from '@/types/cv'
import type { CvFullRecord } from '@/types/cv'
import type { CvBuilderSection } from '@/lib/cv/constants'

export type SectionCompleteness = 'empty' | 'partial' | 'complete'

export type SectionCompletenessMap = Record<CvBuilderSection, SectionCompleteness>

function hasBuilderAdditional(cv: CvFullRecord): boolean {
  return cv.additional.some((entry) =>
    (BUILDER_ADDITIONAL_CATEGORIES as readonly string[]).includes(entry.category),
  )
}

/** Section 7.4 — completeness rules for all five builder sections. */
export function useSectionCompleteness(cv: CvFullRecord | undefined): SectionCompletenessMap {
  if (!cv) {
    return {
      header: 'empty',
      education: 'empty',
      experience: 'empty',
      skills: 'empty',
      additional: 'empty',
    }
  }

  const header: SectionCompleteness = !cv.full_name?.trim()
    ? 'empty'
    : cv.full_name.trim() && cv.email?.trim() && (cv.phone?.trim() || cv.city?.trim())
      ? 'complete'
      : 'partial'

  const education: SectionCompleteness = !cv.education.length
    ? 'empty'
    : cv.education.some(
        (entry) =>
          entry.institution_name.trim() &&
          (entry.degree?.trim() || entry.field_of_study?.trim() || entry.start_year != null),
      )
      ? 'complete'
      : 'partial'

  const experience: SectionCompleteness = !cv.experience.length
    ? 'empty'
    : cv.experience.some(
        (entry) =>
          entry.company_name.trim() &&
          entry.job_title.trim() &&
          entry.bullets.some((bullet) => bullet.trim()),
      )
      ? 'complete'
      : 'partial'

  const skills: SectionCompleteness =
    !cv.technical_skills?.length && !cv.languages?.length
      ? 'empty'
      : cv.technical_skills?.length && cv.languages?.length
        ? 'complete'
        : 'partial'

  const additional: SectionCompleteness = !hasBuilderAdditional(cv)
    ? 'empty'
    : cv.additional.some(
        (entry) =>
          (BUILDER_ADDITIONAL_CATEGORIES as readonly string[]).includes(entry.category) &&
          entry.title.trim() &&
          (entry.issuer?.trim() || entry.description?.trim() || entry.start_date),
      )
      ? 'complete'
      : 'partial'

  return {
    header,
    education,
    experience,
    skills,
    additional,
  }
}
