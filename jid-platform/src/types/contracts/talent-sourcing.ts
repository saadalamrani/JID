/**
 * Wave 8 — Talent sourcing + governed Professional Discovery.
 * Additive to Wave 5 hiring and Wave 6 evidence contracts. Does not redefine
 * Application, Outcome, or the evidence observation/rating model.
 *
 * Canonical chain:
 *   HIRING NEED → EXPLICIT CRITERIA → ELIGIBLE/CONSENTED DISCOVERY
 *   → PUBLISHED PROFESSIONAL EVIDENCE → EXPLAINABLE COMPARISON
 *   → EMPLOYER HUMAN ACTION → CANDIDATE-CONTROLLED INVITATION
 *
 * Discoverable ≠ interested ≠ invited ≠ applied.
 * Employer interest never creates an Application.
 */

export const TALENT_DISCOVERY_STATES = [
  'NOT_DISCOVERABLE',
  'DISCOVERABLE',
  'INVITED',
  'INTERESTED',
  'DECLINED',
  'WITHDRAWN',
] as const
export type TalentDiscoveryState = (typeof TALENT_DISCOVERY_STATES)[number]

export const TALENT_INVITATION_STATES = [
  'INVITED',
  'INTERESTED',
  'DECLINED',
  'WITHDRAWN',
] as const
export type TalentInvitationState = (typeof TALENT_INVITATION_STATES)[number]

export const TALENT_SOURCING_EVENT_TYPES = [
  'SEARCH',
  'CARD_VIEWED',
  'COMPARED',
  'INVITED',
  'INVITATION_WITHDRAWN',
  'INVITATION_RESPONDED',
] as const
export type TalentSourcingEventType = (typeof TALENT_SOURCING_EVENT_TYPES)[number]

/** Explicit Individual control. Default is safe (not discoverable). */
export type ProfessionalDiscoverability = {
  visibility: 'private' | 'discoverable'
  showProfileToCompanies: boolean
}

export function isProfessionallyDiscoverable(
  input: ProfessionalDiscoverability & {
    role?: string | null
    profileState?: string | null
    deletedAt?: string | null
    suspendedAt?: string | null
  },
): boolean {
  if (input.role && input.role !== 'individual') return false
  if (input.deletedAt) return false
  if (input.suspendedAt) return false
  if (input.profileState && input.profileState !== 'active' && input.profileState !== 'incomplete') {
    return false
  }
  return input.visibility === 'discoverable' && input.showProfileToCompanies === true
}

/**
 * Discoverability never implies job-seeking, open contact, JID endorsement,
 * high match, or eligibility for a role.
 */
export const DISCOVERABILITY_DOES_NOT_IMPLY = [
  'SEEKING_WORK',
  'CONSENT_TO_DIRECT_CONTACT_BY_EVERYONE',
  'JID_ENDORSEMENT',
  'HIGH_MATCH',
  'GUARANTEED_ELIGIBILITY',
] as const

export type PublishedSkill = {
  id: string
  name: string
  nameAr: string | null
}

/** Safe projection only. No email, phone, notes, Career Operations, or unpublished evidence. */
export type DiscoverableTalentCard = {
  profileId: string
  displayName: string
  headline: string | null
  about: string | null
  targetSectors: readonly string[]
  targetProgramTypes: readonly string[]
  targetRegions: readonly string[]
  skills: readonly PublishedSkill[]
  invitationState: TalentInvitationState | null
}

export type RelevanceReason = {
  criterionId: string
  criterionLabelAr: string
  criterionLabelEn: string
  evidencePresent: boolean
  reasonAr: string
  reasonEn: string
}

export type TalentSearchHit = DiscoverableTalentCard & {
  reasons: readonly RelevanceReason[]
}

export type SourcingComparisonCell = {
  profileId: string
  criterionId: string
  evidencePresent: boolean
  observationAr: string
  observationEn: string
}

export type SourcingComparisonRow = {
  profileId: string
  displayName: string
  cells: readonly SourcingComparisonCell[]
}

/** Never includes total, rank, match %, or culture-fit. */
export type SourcingComparisonGrid = {
  hiringRoleId: string
  criteria: readonly { criterionId: string; labelAr: string; labelEn: string }[]
  rows: readonly SourcingComparisonRow[]
}

export type TalentInvitation = {
  id: string
  hiringRoleId: string
  jobId: string
  candidateProfileId: string
  businessProfileId: string
  state: TalentInvitationState
  messageAr: string
  messageEn: string
  applicationId: string | null
  createdAt: string
  respondedAt: string | null
}

/**
 * Operational metric with mandatory provenance. Invented KPIs are forbidden.
 */
export type HiringIntelligenceMetric = {
  id: 'sourced_candidates' | 'invitations_sent' | 'responses' | 'applications_from_sourcing' | 'evidence_coverage'
  labelAr: string
  labelEn: string
  value: number
  unit: 'count' | 'ratio'
  source: string
  population: string
  timeWindow: string
  coverage: string
  missingness: string
}

export type HiringIntelligenceReport = {
  hiringRoleId: string
  generatedAt: string
  metrics: readonly HiringIntelligenceMetric[]
}
