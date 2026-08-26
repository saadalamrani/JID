import type { ContractId, ContractReference, IsoTimestamp, VersionedContract } from './common'

export const JOURNEY_EVENT_ORIGINS = [
  'USER_DECLARED',
  'SYSTEM_OBSERVED',
  'EMPLOYER_CONFIRMED',
  'INSTITUTION_CONFIRMED',
  'THIRD_PARTY_SOURCED',
  'ADMIN_CORRECTION',
] as const
export type JourneyEventOrigin = (typeof JOURNEY_EVENT_ORIGINS)[number]

export const JOURNEY_OUTCOMES = [
  'WITHDRAWN',
  'REJECTED',
  'OFFERED',
  'EMPLOYED',
  'NOT_EMPLOYED',
  'COMPLETED',
  'NOT_COMPLETED',
] as const
export type JourneyOutcome = (typeof JOURNEY_OUTCOMES)[number]

type JourneyEventBase = VersionedContract & {
  event_id: ContractId
  event_type: string
  event_version: string
  subject_id: ContractId
  opportunity_id?: ContractId
  organization_ref_id?: ContractId
  origin_class: JourneyEventOrigin
  actor_or_source_ref: ContractReference
  occurred_at: IsoTimestamp
  recorded_at: IsoTimestamp
  payload: Readonly<Record<string, unknown>>
  evidence_ref?: ContractReference
  disclosure_authorization_ref?: ContractReference
}

export type JourneyEvent =
  | (JourneyEventBase & {
      event_kind: 'ACTION' | 'STAGE'
      outcome?: never
      corrects_event_id?: never
    })
  | (JourneyEventBase & {
      event_kind: 'OUTCOME'
      outcome: JourneyOutcome
      corrects_event_id?: never
    })
  | (JourneyEventBase & {
      event_kind: 'CORRECTION'
      origin_class: 'ADMIN_CORRECTION'
      corrects_event_id: ContractId
      outcome?: JourneyOutcome
    })

export function isJourneyOutcome(value: string): value is JourneyOutcome {
  return (JOURNEY_OUTCOMES as readonly string[]).includes(value)
}
