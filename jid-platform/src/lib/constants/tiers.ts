/**
 * Badge constitution: every opportunity card renders exactly one tier badge.
 * Person badges (e.g., Graduate Badge) NEVER occupy this slot.
 */

export const OPPORTUNITY_TIERS = {
  normal: { ar: 'عادي', en: 'Normal' },
  plus: { ar: 'بلس', en: 'Plus' },
} as const

export type OpportunityTier = keyof typeof OPPORTUNITY_TIERS
