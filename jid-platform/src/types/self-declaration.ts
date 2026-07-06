/** Section 4.5 — self-declaration state machine. */
export const SELF_DECLARATION_STATES = [
  'not_applied',
  'just_clicked',
  'declared',
  'in_progress',
] as const

export type SelfDeclarationState = (typeof SELF_DECLARATION_STATES)[number]

export type JobDeclarationStatus = {
  declared: boolean
  saved: boolean
  primaryEmail: string | null
}

export type SaveApplicationResult = {
  saved: boolean
}

export type DeclareApplicationResult = {
  declared: boolean
  alreadyExists?: boolean
}
