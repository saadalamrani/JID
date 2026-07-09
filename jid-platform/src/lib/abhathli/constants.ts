/** ابحثلي — spec-locked copy and thresholds. */

export const ABHATHLI_MATCH_TAG_AR = 'وجدتها ابحثلي'

export const ABHATHLI_MAX_ACTIVE_MANDATES = 3

export const ABHATHLI_MATCH_SCORE_THRESHOLD = 0.55

export const ABHATHLI_DISMISS_REASONS = [
  'wrong_city',
  'wrong_level',
  'not_interested',
] as const

export type AbhathliDismissReason = (typeof ABHATHLI_DISMISS_REASONS)[number]

export const ABHATHLI_DISMISS_REASON_LABELS: Record<AbhathliDismissReason, string> = {
  wrong_city: 'مدينة/منطقة غير مناسبة',
  wrong_level: 'مستوى غير مناسب',
  not_interested: 'غير مهتم',
}
