/**
 * Constitutional terminology — Profile Architecture v2.
 * Directory ≠ Profile. Do not introduce synonyms.
 */

export const TERMS = {
  directory: { ar: 'الدليل', en: 'Directory' },
  companyDirectory: { ar: 'دليل الجهات', en: 'Company Directory' },
  universityDirectory: { ar: 'دليل الجامعات', en: 'University Directory' },
  profile: { ar: 'الملف التعريفي', en: 'Profile' },
  businessProfile: { ar: 'الملف التعريفي للمنشأة', en: 'Business Profile' },
  universityProfile: { ar: 'ملف الجامعة', en: 'University Profile' },
} as const

export type TermKey = keyof typeof TERMS
