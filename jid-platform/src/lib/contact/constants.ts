/** Section 9.1 — contact form category options (stored in subject prefix). */
export const CONTACT_CATEGORIES = [
  'general',
  'support',
  'privacy',
  'partnership',
  'feedback',
] as const

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]

export const CONTACT_RATE_LIMIT = {
  max: 3,
  window: '1 h' as const,
} as const
