/** Section 4.4 / 7.4 — fixed CV builder section order. */
export const CV_BUILDER_SECTIONS = [
  'header',
  'education',
  'experience',
  'skills',
  'additional',
] as const

export type CvBuilderSection = (typeof CV_BUILDER_SECTIONS)[number]

export const CV_ZOOM_LEVELS = [0.75, 1, 1.25] as const
export type CvZoomLevel = (typeof CV_ZOOM_LEVELS)[number]

export const DEFAULT_CV_ZOOM: CvZoomLevel = 1

/** Experience / education year pickers — historical through near-future only. */
export const CV_YEAR_MIN = 1980
export const CV_YEAR_MAX = 2035

/** Descending year list for selects (Latin digits via String()). */
export const CV_YEAR_OPTIONS: readonly number[] = Array.from(
  { length: CV_YEAR_MAX - CV_YEAR_MIN + 1 },
  (_, index) => CV_YEAR_MAX - index,
)

export function isCvBuilderSection(value: string): value is CvBuilderSection {
  return (CV_BUILDER_SECTIONS as readonly string[]).includes(value)
}
