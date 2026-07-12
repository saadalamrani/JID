/**
 * Product display names — Annex B items pending founder sign-off.
 * Safe to render; unsafe to rebrand without approval.
 */

/** PENDING_FOUNDER_SIGNOFF — Annex B item; safe to render, unsafe to rebrand. */
export const careerCanvas = { ar: 'لوحة المسار', en: 'Career Canvas' } as const

/** PENDING_FOUNDER_SIGNOFF — Annex B item; safe to render, unsafe to rebrand. */
export const impactDrops = { ar: 'قطرات الأثر', en: 'Impact Drops' } as const

/** PENDING_FOUNDER_SIGNOFF — Annex B item; safe to render, unsafe to rebrand. */
export const evidenceVault = { ar: 'خزانة الإثبات', en: 'Evidence Vault' } as const

/** PENDING_FOUNDER_SIGNOFF — Annex B item; safe to render, unsafe to rebrand. */
export const careerTimeline = { ar: 'الخط الزمني المهني', en: 'Career Timeline' } as const

/** PENDING_FOUNDER_SIGNOFF — Annex B item; safe to render, unsafe to rebrand. */
export const graduateBadge = { ar: 'شارة الخريج', en: 'Graduate Badge' } as const

/** PENDING_FOUNDER_SIGNOFF — Annex B item; safe to render, unsafe to rebrand. */
export const lammah = { ar: 'لمّاح', en: 'Lammah' } as const

/** PENDING_FOUNDER_SIGNOFF — Annex B item; safe to render, unsafe to rebrand. */
export const abhathli = { ar: 'ابحثلي', en: 'Search-For-Me' } as const

export const PRODUCT_NAMES = {
  careerCanvas,
  impactDrops,
  evidenceVault,
  careerTimeline,
  graduateBadge,
  lammah,
  abhathli,
} as const

export type ProductNameKey = keyof typeof PRODUCT_NAMES
