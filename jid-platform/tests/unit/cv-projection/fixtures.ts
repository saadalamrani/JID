import type { CvProjection } from '@/features/cv-projection/operations'
import { defaultCvProjectionSections } from '@/features/cv-projection/operations'
import { populatedCareerEvidence } from '../career-record/fixtures'

export function makeCvProjection(overrides: Partial<CvProjection> = {}): CvProjection {
  const evidence = overrides.evidence ?? populatedCareerEvidence
  return {
    cv_id: 'cv-1',
    title: 'سيرة للتقديم',
    summary: 'ملخص لهذه السيرة فقط',
    locale: 'ar',
    template_key: 'basic_free',
    share: { kind: 'private' },
    sections: defaultCvProjectionSections(),
    items: evidence.map((item, index) => ({
      evidence_id: item.evidence_id,
      section_key:
        item.category === 'EDUCATION'
          ? 'EDUCATION'
          : item.category === 'EXPERIENCE'
            ? 'EXPERIENCE'
            : item.category === 'SKILL'
              ? 'SKILLS'
              : item.category === 'PROJECT'
                ? 'PROJECTS'
                : item.category === 'CREDENTIAL'
                  ? 'CREDENTIALS'
                  : item.category === 'AWARD'
                    ? 'AWARDS'
                    : item.category === 'LANGUAGE'
                      ? 'LANGUAGES'
                      : item.category === 'VOLUNTEERING'
                        ? 'VOLUNTEERING'
                        : item.category === 'PUBLICATION'
                          ? 'PUBLICATIONS'
                          : 'OTHER',
      sort_order: index,
      is_selected: item.category === 'EXPERIENCE',
      presentation_payload: {},
    })),
    evidence,
    ...overrides,
  }
}
