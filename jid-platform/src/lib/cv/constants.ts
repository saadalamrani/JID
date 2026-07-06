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

export function isCvBuilderSection(value: string): value is CvBuilderSection {
  return (CV_BUILDER_SECTIONS as readonly string[]).includes(value)
}
