import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { fetchUserApplications } from '@/lib/queries/radar'
import { listCareerEvidence } from '@/lib/career-record/service'
import {
  nativeOpportunityId,
  parseOpportunityId,
  type OpportunityDiscoveryItem,
} from '@/lib/opportunity/discovery-types'
import { classifyAttentionBuckets } from './attention'
import {
  mayLinkApplication,
  parseProjectedCareerItemId,
} from './application-bridge'
import {
  buildCareerIntelligenceInsights,
  extractCareerRecordTokens,
} from './intelligence'
import { mergeCareerItemsWithApplications } from './merge-board'
import type {
  CareerActionKind,
  CareerItem,
  CareerJourneyEvent,
  CareerNextAction,
  CareerOperationalState,
  CareerOperationsBoard,
  CareerOutcomeKind,
} from './types'
import { isCareerActionKind, isCareerOperationalState, isCareerOutcomeKind } from './types'

type TypedClient = Awaited<ReturnType<typeof createClient>>

export class CareerOperationsError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message)
    this.name = 'CareerOperationsError'
  }
}

type CareerItemRow = {
  id: string
  user_id: string
  opportunity_id: string
  source_class: 'JID_NATIVE' | 'GOVERNED_EXTERNAL'
  application_id: string | null
  operational_state: string
  outcome_kind: string | null
  title_ar: string | null
  title_en: string | null
  organization_name: string | null
  deadline_at: string | null
  apply_authority: string | null
  apply_url: string | null
  last_user_action_at: string | null
  last_employer_action_at: string | null
  last_system_event_at: string | null
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

type ActionRow = {
  id: string
  career_item_id: string
  kind: string
  label: string
  due_at: string | null
  completed_at: string | null
  is_follow_up: boolean
}

type EventRow = {
  id: string
  career_item_id: string
  actor_kind: 'user' | 'employer' | 'system'
  event_type: string
  summary: string
  occurred_at: string
}

type InterviewRow = {
  id: string
  career_item_id: string
  scheduled_at: string
  location_or_mode: string | null
  notes: string | null
}

type NoteCountRow = {
  career_item_id: string
}

function mapAction(row: ActionRow): CareerNextAction {
  return {
    id: row.id,
    kind: isCareerActionKind(row.kind) ? row.kind : 'custom',
    label: row.label,
    due_at: row.due_at,
    completed_at: row.completed_at,
    is_follow_up: row.is_follow_up,
  }
}

function hydrateItems(
  rows: CareerItemRow[],
  actions: ActionRow[],
  events: EventRow[],
  interviews: InterviewRow[],
  noteItemIds: string[],
): CareerItem[] {
  const actionsByItem = new Map<string, CareerNextAction[]>()
  for (const row of actions) {
    const list = actionsByItem.get(row.career_item_id) ?? []
    list.push(mapAction(row))
    actionsByItem.set(row.career_item_id, list)
  }
  const eventsByItem = new Map<string, CareerJourneyEvent[]>()
  for (const row of events) {
    const list = eventsByItem.get(row.career_item_id) ?? []
    list.push({
      id: row.id,
      actor_kind: row.actor_kind,
      event_type: row.event_type,
      summary: row.summary,
      occurred_at: row.occurred_at,
    })
    eventsByItem.set(row.career_item_id, list)
  }
  const interviewsByItem = new Map<string, CareerItem['interviews']>()
  for (const row of interviews) {
    const list = interviewsByItem.get(row.career_item_id) ?? []
    list.push({
      id: row.id,
      scheduled_at: row.scheduled_at,
      location_or_mode: row.location_or_mode,
      notes: row.notes,
    })
    interviewsByItem.set(row.career_item_id, list)
  }
  const noteCounts = new Map<string, number>()
  for (const id of noteItemIds) {
    noteCounts.set(id, (noteCounts.get(id) ?? 0) + 1)
  }

  return rows.map((row) => {
    const itemActions = actionsByItem.get(row.id) ?? []
    const open = itemActions.filter((action) => !action.completed_at)
    const next = open.sort((a, b) => {
      const aDue = a.due_at ? Date.parse(a.due_at) : Number.POSITIVE_INFINITY
      const bDue = b.due_at ? Date.parse(b.due_at) : Number.POSITIVE_INFINITY
      return aDue - bDue
    })[0] ?? null
    return {
      id: row.id,
      origin: 'career_item' as const,
      user_id: row.user_id,
      opportunity_id: row.opportunity_id,
      source_class: row.source_class,
      opportunity_family: parseOpportunityId(row.opportunity_id)?.source_class === 'JID_NATIVE' ? 'JOB' : null,
      application_id: row.application_id,
      application_status: null,
      operational_state: isCareerOperationalState(row.operational_state)
        ? row.operational_state
        : 'considering',
      outcome_kind: row.outcome_kind && isCareerOutcomeKind(row.outcome_kind) ? row.outcome_kind : null,
      title_ar: row.title_ar,
      title_en: row.title_en,
      organization_name: row.organization_name,
      deadline_at: row.deadline_at,
      apply_authority: row.apply_authority as CareerItem['apply_authority'],
      apply_url: row.apply_url,
      next_action: next,
      open_follow_ups: open.filter((action) => action.is_follow_up),
      interviews: interviewsByItem.get(row.id) ?? [],
      latest_events: (eventsByItem.get(row.id) ?? []).slice(0, 8),
      last_user_action_at: row.last_user_action_at,
      last_employer_action_at: row.last_employer_action_at,
      last_system_event_at: row.last_system_event_at,
      last_seen_at: row.last_seen_at,
      note_count: noteCounts.get(row.id) ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  })
}

async function loadPersistedItems(client: TypedClient, userId: string): Promise<CareerItem[]> {
  const { data, error } = await client
    .from('career_items')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) return []
    throw new CareerOperationsError(error.message)
  }
  const rows = (data ?? []) as CareerItemRow[]
  if (rows.length === 0) return []
  const ids = rows.map((row) => row.id)

  const [actionsRes, eventsRes, interviewsRes, notesRes] = await Promise.all([
    client.from('career_item_actions').select('*').eq('user_id', userId).in('career_item_id', ids),
    client.from('career_item_events').select('*').eq('user_id', userId).in('career_item_id', ids),
    client.from('career_item_interviews').select('*').eq('user_id', userId).in('career_item_id', ids),
    client.from('career_item_notes').select('career_item_id').eq('user_id', userId).in('career_item_id', ids),
  ])

  return hydrateItems(
    rows,
    (actionsRes.data ?? []) as ActionRow[],
    (eventsRes.data ?? []) as EventRow[],
    (interviewsRes.data ?? []) as InterviewRow[],
    ((notesRes.data ?? []) as NoteCountRow[]).map((row) => row.career_item_id),
  )
}

export async function loadCareerOperationsBoard(userId: string): Promise<CareerOperationsBoard> {
  const supabase = await createClient()
  const client = supabase
  const now = new Date()
  const [persisted, applicationsResult, evidence] = await Promise.all([
    loadPersistedItems(client, userId),
    fetchUserApplications(userId),
    listCareerEvidence().catch(() => []),
  ])

  const items = mergeCareerItemsWithApplications(
    persisted,
    applicationsResult.applications,
    now.toISOString(),
  )
  const buckets = classifyAttentionBuckets(items, now)
  const tokens = extractCareerRecordTokens(
    evidence.map((row) => ({
      category: row.category,
      payload: (row.current_revision?.fact_payload ?? {}) as Record<string, unknown>,
    })),
  )

  return {
    items,
    needs_attention: buckets.needs_attention,
    upcoming: buckets.upcoming,
    waiting: buckets.waiting,
    changed: buckets.changed,
    next: buckets.next,
    insights: buildCareerIntelligenceInsights({
      items,
      careerRecordTokens: tokens,
      timeWindowLabelAr: 'الفرص الحالية على رادارك',
      timeWindowLabelEn: 'current opportunities on your Radar',
      now,
    }),
  }
}

async function insertEvent(
  client: TypedClient,
  input: {
    career_item_id: string
    user_id: string
    actor_kind: 'user' | 'employer' | 'system'
    event_type: string
    summary: string
  },
): Promise<void> {
  const { error } = await client.from('career_item_events').insert({
    career_item_id: input.career_item_id,
    user_id: input.user_id,
    actor_kind: input.actor_kind,
    event_type: input.event_type,
    summary: input.summary,
  })
  if (error) throw new CareerOperationsError(error.message)
}

export async function ensureCareerItemFromOpportunity(input: {
  userId: string
  opportunity: Pick<
    OpportunityDiscoveryItem,
    | 'opportunity_id'
    | 'source_class'
    | 'title'
    | 'organization_name'
    | 'expires_at'
    | 'apply_authority'
    | 'apply_url'
  >
}): Promise<CareerItem> {
  if (
    input.opportunity.source_class === 'GOVERNED_EXTERNAL' &&
    !mayLinkApplication(input.opportunity.source_class)
  ) {
    // boundary documented; application_id stays null
  }

  const supabase = await createClient()
  const client = supabase
  const { data: existing, error: existingError } = await client
    .from('career_items')
    .select('*')
    .eq('user_id', input.userId)
    .eq('opportunity_id', input.opportunity.opportunity_id)
    .maybeSingle()
  if (existingError && !/does not exist|schema cache/i.test(existingError.message)) {
    throw new CareerOperationsError(existingError.message)
  }
  if (existing) {
    const board = await loadCareerOperationsBoard(input.userId)
    const found = board.items.find((item) => item.id === (existing as CareerItemRow).id)
    if (found) return found
  }

  const { data, error } = await client
    .from('career_items')
    .insert({
      user_id: input.userId,
      opportunity_id: input.opportunity.opportunity_id,
      source_class: input.opportunity.source_class,
      application_id: null,
      operational_state: 'considering',
      title_ar: input.opportunity.title.ar ?? null,
      title_en: input.opportunity.title.en ?? null,
      organization_name: input.opportunity.organization_name ?? null,
      deadline_at: input.opportunity.expires_at ?? null,
      apply_authority: input.opportunity.apply_authority,
      apply_url: input.opportunity.apply_url ?? null,
      last_user_action_at: new Date().toISOString(),
    })
    .select('*')
    .single()
  if (error) throw new CareerOperationsError(error.message)
  const row = data as CareerItemRow
  await insertEvent(client, {
    career_item_id: row.id,
    user_id: input.userId,
    actor_kind: 'user',
    event_type: 'consider',
    summary: 'User added this opportunity to Career Operations.',
  })
  const board = await loadCareerOperationsBoard(input.userId)
  const created = board.items.find((item) => item.id === row.id)
  if (!created) throw new CareerOperationsError('تعذر إنشاء عنصر المسار المهني', 500)
  return created
}

export async function ensureCareerItemFromApplication(input: {
  userId: string
  applicationId: string
}): Promise<CareerItem> {
  const applications = await fetchUserApplications(input.userId)
  const application = applications.applications.find((row) => row.id === input.applicationId)
  if (!application || application.applicant_id !== input.userId) {
    throw new CareerOperationsError('الطلب غير موجود', 404)
  }

  const supabase = await createClient()
  const client = supabase
  const opportunityId = nativeOpportunityId(application.job_id)
  const { data, error } = await client
    .from('career_items')
    .upsert(
      {
        user_id: input.userId,
        opportunity_id: opportunityId,
        source_class: 'JID_NATIVE',
        application_id: application.id,
        operational_state: 'applied',
        title_ar: application.job?.title_ar ?? null,
        title_en: application.job?.title_en ?? null,
        organization_name: application.company?.name_ar || application.company?.name_en || null,
        deadline_at: application.job?.application_deadline ?? null,
        apply_authority: 'JID_NATIVE',
        last_user_action_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,opportunity_id' },
    )
    .select('*')
    .single()
  if (error) throw new CareerOperationsError(error.message)
  const board = await loadCareerOperationsBoard(input.userId)
  const created = board.items.find((item) => item.id === (data as CareerItemRow).id)
  if (!created) throw new CareerOperationsError('تعذر ربط الطلب', 500)
  return created
}

export async function resolveCareerItemForUser(
  userId: string,
  itemId: string,
): Promise<CareerItem> {
  const projectedApplicationId = parseProjectedCareerItemId(itemId)
  if (projectedApplicationId) {
    return ensureCareerItemFromApplication({ userId, applicationId: projectedApplicationId })
  }
  const board = await loadCareerOperationsBoard(userId)
  const found = board.items.find((item) => item.id === itemId)
  if (!found) throw new CareerOperationsError('العنصر غير موجود', 404)
  if (found.origin === 'application_projection' && found.application_id) {
    return ensureCareerItemFromApplication({ userId, applicationId: found.application_id })
  }
  return found
}

export async function addCareerItemNote(input: {
  userId: string
  itemId: string
  body: string
}): Promise<void> {
  const item = await resolveCareerItemForUser(input.userId, input.itemId)
  const body = input.body.trim()
  if (!body) throw new CareerOperationsError('الملاحظة فارغة', 422)
  const supabase = await createClient()
  const client = supabase
  const { error } = await client.from('career_item_notes').insert({
    career_item_id: item.id,
    user_id: input.userId,
    body,
  })
  if (error) throw new CareerOperationsError(error.message)
  await insertEvent(client, {
    career_item_id: item.id,
    user_id: input.userId,
    actor_kind: 'user',
    event_type: 'note',
    summary: 'User added a private note.',
  })
}

export async function addCareerItemAction(input: {
  userId: string
  itemId: string
  kind: CareerActionKind
  label: string
  dueAt: string | null
  isFollowUp: boolean
}): Promise<void> {
  const item = await resolveCareerItemForUser(input.userId, input.itemId)
  const supabase = await createClient()
  const client = supabase
  const { error } = await client.from('career_item_actions').insert({
    career_item_id: item.id,
    user_id: input.userId,
    kind: input.kind,
    label: input.label.trim(),
    due_at: input.dueAt,
    is_follow_up: input.isFollowUp,
  })
  if (error) throw new CareerOperationsError(error.message)
  await client
    .from('career_items')
    .update({
      last_user_action_at: new Date().toISOString(),
      operational_state: input.isFollowUp ? 'following_up' : item.operational_state,
    })
    .eq('id', item.id)
    .eq('user_id', input.userId)
  await insertEvent(client, {
    career_item_id: item.id,
    user_id: input.userId,
    actor_kind: 'user',
    event_type: input.isFollowUp ? 'follow_up' : 'next_action',
    summary: input.label.trim(),
  })
}

export async function completeCareerItemAction(input: {
  userId: string
  actionId: string
}): Promise<void> {
  const supabase = await createClient()
  const client = supabase
  const { error } = await client
    .from('career_item_actions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', input.actionId)
    .eq('user_id', input.userId)
  if (error) throw new CareerOperationsError(error.message)
}

export async function addCareerInterview(input: {
  userId: string
  itemId: string
  scheduledAt: string
  locationOrMode: string | null
  notes: string | null
}): Promise<void> {
  const item = await resolveCareerItemForUser(input.userId, input.itemId)
  const supabase = await createClient()
  const client = supabase
  const { error } = await client.from('career_item_interviews').insert({
    career_item_id: item.id,
    user_id: input.userId,
    scheduled_at: input.scheduledAt,
    location_or_mode: input.locationOrMode,
    notes: input.notes,
  })
  if (error) throw new CareerOperationsError(error.message)
  await client
    .from('career_items')
    .update({
      operational_state: 'interviewing',
      last_user_action_at: new Date().toISOString(),
    })
    .eq('id', item.id)
    .eq('user_id', input.userId)
  await insertEvent(client, {
    career_item_id: item.id,
    user_id: input.userId,
    actor_kind: 'user',
    event_type: 'interview',
    summary: 'User recorded an interview.',
  })
}

export async function recordCareerOutcome(input: {
  userId: string
  itemId: string
  outcome: CareerOutcomeKind
}): Promise<void> {
  const item = await resolveCareerItemForUser(input.userId, input.itemId)
  const supabase = await createClient()
  const client = supabase
  const { error } = await client
    .from('career_items')
    .update({
      operational_state: 'outcome' satisfies CareerOperationalState,
      outcome_kind: input.outcome,
      last_user_action_at: new Date().toISOString(),
    })
    .eq('id', item.id)
    .eq('user_id', input.userId)
  if (error) throw new CareerOperationsError(error.message)
  await insertEvent(client, {
    career_item_id: item.id,
    user_id: input.userId,
    actor_kind: 'user',
    event_type: 'outcome',
    summary: `User recorded outcome: ${input.outcome}`,
  })
}

export async function markCareerItemApplied(input: {
  userId: string
  itemId: string
  declaredExternal: boolean
}): Promise<void> {
  const item = await resolveCareerItemForUser(input.userId, input.itemId)
  if (item.source_class === 'GOVERNED_EXTERNAL' && !input.declaredExternal) {
    throw new CareerOperationsError('الإقرار مطلوب للفرص الخارجية', 422)
  }
  if (item.source_class === 'GOVERNED_EXTERNAL' && item.application_id) {
    throw new CareerOperationsError('لا يمكن ربط فرصة خارجية بطلب داخلي', 409)
  }
  const supabase = await createClient()
  const client = supabase
  const { error } = await client
    .from('career_items')
    .update({
      operational_state: 'applied',
      last_user_action_at: new Date().toISOString(),
    })
    .eq('id', item.id)
    .eq('user_id', input.userId)
  if (error) throw new CareerOperationsError(error.message)
  await insertEvent(client, {
    career_item_id: item.id,
    user_id: input.userId,
    actor_kind: 'user',
    event_type: input.declaredExternal ? 'declared_external_apply' : 'applied',
    summary: input.declaredExternal
      ? 'User declared an external application. The employer does not participate in JID.'
      : 'User marked this opportunity as applied.',
  })
}

export async function listCareerItemNotes(userId: string, itemId: string): Promise<{ id: string; body: string; created_at: string }[]> {
  const item = await resolveCareerItemForUser(userId, itemId)
  const supabase = await createClient()
  const client = supabase
  const { data, error } = await client
    .from('career_item_notes')
    .select('id, body, created_at')
    .eq('user_id', userId)
    .eq('career_item_id', item.id)
    .order('created_at', { ascending: false })
  if (error) throw new CareerOperationsError(error.message)
  return (data ?? []) as { id: string; body: string; created_at: string }[]
}
