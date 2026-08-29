'use server'

import { revalidatePath } from 'next/cache'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import {
  addCareerInterview,
  addCareerItemAction,
  addCareerItemNote,
  completeCareerItemAction,
  ensureCareerItemFromOpportunity,
  markCareerItemApplied,
  recordCareerOutcome,
  CareerOperationsError,
} from '@/lib/career-operations/service'
import type { CareerActionKind, CareerOutcomeKind } from '@/lib/career-operations/types'
import type { OpportunityDiscoveryItem } from '@/lib/opportunity/discovery-types'

function revalidateRadar(): void {
  revalidatePath('/radar')
  revalidatePath('/en/radar')
}

export async function trackOpportunityOnRadarAction(input: {
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
}): Promise<{ ok: true; itemId: string } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthenticatedUser()
    const item = await ensureCareerItemFromOpportunity({
      userId,
      opportunity: input.opportunity,
    })
    revalidateRadar()
    return { ok: true, itemId: item.id }
  } catch (error) {
    const message = error instanceof CareerOperationsError ? error.message : 'تعذر حفظ الفرصة في الرادار'
    return { ok: false, error: message }
  }
}

export async function addRadarNoteAction(input: {
  itemId: string
  body: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthenticatedUser()
    await addCareerItemNote({ userId, itemId: input.itemId, body: input.body })
    revalidateRadar()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'تعذر حفظ الملاحظة' }
  }
}

export async function addRadarActionAction(input: {
  itemId: string
  kind: CareerActionKind
  label: string
  dueAt: string | null
  isFollowUp: boolean
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthenticatedUser()
    await addCareerItemAction({
      userId,
      itemId: input.itemId,
      kind: input.kind,
      label: input.label,
      dueAt: input.dueAt,
      isFollowUp: input.isFollowUp,
    })
    revalidateRadar()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'تعذر حفظ الخطوة' }
  }
}

export async function completeRadarActionAction(input: {
  actionId: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthenticatedUser()
    await completeCareerItemAction({ userId, actionId: input.actionId })
    revalidateRadar()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'تعذر إكمال الخطوة' }
  }
}

export async function addRadarInterviewAction(input: {
  itemId: string
  scheduledAt: string
  locationOrMode: string | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthenticatedUser()
    await addCareerInterview({
      userId,
      itemId: input.itemId,
      scheduledAt: input.scheduledAt,
      locationOrMode: input.locationOrMode,
      notes: null,
    })
    revalidateRadar()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'تعذر حفظ المقابلة' }
  }
}

export async function recordRadarOutcomeAction(input: {
  itemId: string
  outcome: CareerOutcomeKind
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthenticatedUser()
    await recordCareerOutcome({ userId, itemId: input.itemId, outcome: input.outcome })
    revalidateRadar()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'تعذر حفظ النتيجة' }
  }
}

export async function declareExternalAppliedAction(input: {
  itemId: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthenticatedUser()
    await markCareerItemApplied({ userId, itemId: input.itemId, declaredExternal: true })
    revalidateRadar()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'تعذر تسجيل التقديم الخارجي' }
  }
}
