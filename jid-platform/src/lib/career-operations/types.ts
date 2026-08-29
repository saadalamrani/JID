/**
 * Wave 4 Career Operations domain types.
 *
 * Application / Application Snapshot remain Wave 5 shared contracts.
 * These types are Individual-private operational state. They must not be
 * treated as employer hiring-stage truth.
 */

import type { ApplicationStatus } from '@/types/application'
import type {
  OpportunityDiscoveryApplyAuthority,
  OpportunityDiscoveryFamily,
  OpportunitySourceClass,
} from '@/lib/opportunity/discovery-types'

export const CAREER_OPERATIONAL_STATES = [
  'considering',
  'preparing',
  'applied',
  'interviewing',
  'following_up',
  'waiting',
  'outcome',
] as const
export type CareerOperationalState = (typeof CAREER_OPERATIONAL_STATES)[number]

export const CAREER_OUTCOME_KINDS = [
  'open',
  'offer',
  'accepted',
  'declined',
  'rejected',
  'withdrawn',
  'expired',
  'no_response',
] as const
export type CareerOutcomeKind = (typeof CAREER_OUTCOME_KINDS)[number]

export const CAREER_ACTION_KINDS = [
  'review_posting',
  'prepare_materials',
  'apply',
  'follow_up',
  'attend_interview',
  'send_thanks',
  'record_outcome',
  'custom',
] as const
export type CareerActionKind = (typeof CAREER_ACTION_KINDS)[number]

export const CAREER_EVENT_ACTOR_KINDS = ['user', 'employer', 'system'] as const
export type CareerEventActorKind = (typeof CAREER_EVENT_ACTOR_KINDS)[number]

export const CAREER_ATTENTION_BUCKETS = [
  'needs_attention',
  'upcoming',
  'waiting',
  'changed',
  'next',
] as const
export type CareerAttentionBucket = (typeof CAREER_ATTENTION_BUCKETS)[number]

export type CareerItemOrigin = 'career_item' | 'application_projection'

export type CareerNextAction = {
  id: string
  kind: CareerActionKind
  label: string
  due_at: string | null
  completed_at: string | null
  is_follow_up: boolean
}

export type CareerInterview = {
  id: string
  scheduled_at: string
  location_or_mode: string | null
  notes: string | null
}

export type CareerJourneyEvent = {
  id: string
  actor_kind: CareerEventActorKind
  event_type: string
  summary: string
  occurred_at: string
}

export type CareerItem = {
  id: string
  origin: CareerItemOrigin
  user_id: string
  opportunity_id: string
  source_class: OpportunitySourceClass
  opportunity_family: OpportunityDiscoveryFamily | null
  application_id: string | null
  application_status: ApplicationStatus | null
  operational_state: CareerOperationalState
  outcome_kind: CareerOutcomeKind | null
  title_ar: string | null
  title_en: string | null
  organization_name: string | null
  deadline_at: string | null
  apply_authority: OpportunityDiscoveryApplyAuthority | null
  apply_url: string | null
  next_action: CareerNextAction | null
  open_follow_ups: CareerNextAction[]
  interviews: CareerInterview[]
  latest_events: CareerJourneyEvent[]
  last_user_action_at: string | null
  last_employer_action_at: string | null
  last_system_event_at: string | null
  last_seen_at: string | null
  note_count: number
  created_at: string
  updated_at: string
}

export type CareerIntelligenceInsight = {
  id: string
  token: string
  occurrence_count: number
  source_population: string
  source_population_size: number
  evidenced_in_career_record: boolean
  evidence_examples: string[]
  missingness: 'evidenced' | 'not_evidenced'
  time_window: string
  statement_ar: string
  statement_en: string
}

export type CareerOperationsBoard = {
  items: CareerItem[]
  needs_attention: CareerItem[]
  upcoming: CareerItem[]
  waiting: CareerItem[]
  changed: CareerItem[]
  next: CareerItem[]
  insights: CareerIntelligenceInsight[]
}

export function isCareerOperationalState(value: string): value is CareerOperationalState {
  return (CAREER_OPERATIONAL_STATES as readonly string[]).includes(value)
}

export function isCareerOutcomeKind(value: string): value is CareerOutcomeKind {
  return (CAREER_OUTCOME_KINDS as readonly string[]).includes(value)
}

export function isCareerActionKind(value: string): value is CareerActionKind {
  return (CAREER_ACTION_KINDS as readonly string[]).includes(value)
}

export function isCareerEventActorKind(value: string): value is CareerEventActorKind {
  return (CAREER_EVENT_ACTOR_KINDS as readonly string[]).includes(value)
}
