export const SLA_HOURS = 24

export const ENTITY_WIZARD_STEPS = ['account', 'entity', 'verify_email', 'pending'] as const

export type EntityWizardStep = (typeof ENTITY_WIZARD_STEPS)[number]

export type EntitySignupType = 'company' | 'university'

export const ENTITY_SIGNUP_STORAGE_KEY = {
  company: 'jid-entity-signup-company',
  university: 'jid-entity-signup-university',
} as const
