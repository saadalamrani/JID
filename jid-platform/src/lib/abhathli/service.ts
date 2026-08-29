import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { listCareerEvidence } from '@/lib/career-record/service'
import { listOpportunityDiscovery } from '@/lib/opportunity/discovery'
import { parseOpportunityId, type OpportunityDiscoveryApplyAuthority } from '@/lib/opportunity/discovery-types'
import { ensureCareerItemFromOpportunity, markCareerItemApplied } from '@/lib/career-operations/service'
import { resolveApprovedAction } from './approval'
import { prepareApplicationDraft } from './prepare'
import { rankAbhathliRecommendations } from './recommend'
import { searchOpportunityGraph } from './search'
import {
  AbhathliBoundaryError,
  type AbhathliDraft,
  type AbhathliMandateInput,
  type AbhathliRecommendation,
} from './types'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

export class AbhathliServiceError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'AbhathliServiceError'
  }
}

function factsFromEvidence(
  evidence: Awaited<ReturnType<typeof listCareerEvidence>>,
): { category: string; payload: Record<string, unknown> }[] {
  return evidence.map((row) => ({
    category: row.category,
    payload: (row.current_revision?.fact_payload ?? {}) as Record<string, unknown>,
  }))
}

export async function runAbhathliSearch(input: {
  userId: string
  mandate: AbhathliMandateInput
}): Promise<{
  runId: string
  mandateId: string
  recommendations: Array<AbhathliRecommendation & { recommendation_id: string }>
}> {
  const supabase = await createClient()
  const client = asUntyped(supabase)
  const inventory = await listOpportunityDiscovery({ includeExternal: true })
  const evidence = input.mandate.use_career_record
    ? await listCareerEvidence().catch(() => [])
    : []
  const facts = factsFromEvidence(evidence)
  const ranked = rankAbhathliRecommendations(
    searchOpportunityGraph({
      inventory: inventory.merged,
      mandate: input.mandate,
      careerFacts: facts,
    }),
  ).slice(0, 20)

  const { data: mandateRow, error: mandateError } = await client
    .from('abhathli_mandates')
    .insert({
      user_id: input.userId,
      keywords: input.mandate.keywords,
      families: input.mandate.families,
      cities: input.mandate.cities,
      remote_only: input.mandate.remote_only,
      use_career_record: input.mandate.use_career_record,
    })
    .select('id')
    .single()
  if (mandateError) throw new AbhathliServiceError(mandateError.message)

  const { data: runRow, error: runError } = await client
    .from('abhathli_runs')
    .insert({
      mandate_id: (mandateRow as { id: string }).id,
      user_id: input.userId,
      inventory_size: inventory.merged.length,
      result_count: ranked.length,
    })
    .select('id')
    .single()
  if (runError) throw new AbhathliServiceError(runError.message)

  const runId = (runRow as { id: string }).id
  const recommendationRows = ranked.map((payload) => ({
    run_id: runId,
    user_id: input.userId,
    opportunity_id: payload.opportunity_id,
    payload,
  }))
  if (recommendationRows.length > 0) {
    const { error: recError } = await client.from('abhathli_recommendations').insert(recommendationRows)
    if (recError) throw new AbhathliServiceError(recError.message)
  }

  const { data: stored } = await client
    .from('abhathli_recommendations')
    .select('id, opportunity_id, payload')
    .eq('run_id', runId)
    .eq('user_id', input.userId)

  const recommendations = ((stored ?? []) as { id: string; opportunity_id: string; payload: AbhathliRecommendation }[]).map(
    (row) => ({
      ...row.payload,
      recommendation_id: row.id,
    }),
  )

  return {
    runId,
    mandateId: (mandateRow as { id: string }).id,
    recommendations,
  }
}

export async function createAbhathliDraft(input: {
  userId: string
  recommendationId: string
}): Promise<AbhathliDraft & { draft_id: string }> {
  const supabase = await createClient()
  const client = asUntyped(supabase)
  const { data, error } = await client
    .from('abhathli_recommendations')
    .select('id, opportunity_id, payload')
    .eq('id', input.recommendationId)
    .eq('user_id', input.userId)
    .maybeSingle()
  if (error || !data) throw new AbhathliServiceError('التوصية غير موجودة', 404)
  const recommendation = (data as { payload: AbhathliRecommendation }).payload
  const evidence = await listCareerEvidence().catch(() => [])
  const draft = prepareApplicationDraft({
    recommendation,
    careerFacts: factsFromEvidence(evidence),
  })
  const { data: draftRow, error: draftError } = await client
    .from('abhathli_drafts')
    .insert({
      recommendation_id: input.recommendationId,
      user_id: input.userId,
      opportunity_id: recommendation.opportunity_id,
      payload: draft,
    })
    .select('id')
    .single()
  if (draftError) throw new AbhathliServiceError(draftError.message)
  return { ...draft, draft_id: (draftRow as { id: string }).id }
}

export async function approveAbhathliRecommendation(input: {
  userId: string
  recommendationId: string
}): Promise<{ approval_id: string }> {
  const supabase = await createClient()
  const client = asUntyped(supabase)
  const { data, error } = await client
    .from('abhathli_recommendations')
    .select('id, opportunity_id, payload')
    .eq('id', input.recommendationId)
    .eq('user_id', input.userId)
    .maybeSingle()
  if (error || !data) throw new AbhathliServiceError('التوصية غير موجودة', 404)
  const recommendation = (data as { payload: AbhathliRecommendation }).payload
  const action =
    recommendation.source_class === 'GOVERNED_EXTERNAL' ? 'redirect_external' : 'apply_native'
  const { data: approval, error: approvalError } = await client
    .from('abhathli_approvals')
    .upsert(
      {
        recommendation_id: input.recommendationId,
        user_id: input.userId,
        opportunity_id: recommendation.opportunity_id,
        action,
        approved: true,
        approved_at: new Date().toISOString(),
      },
      { onConflict: 'recommendation_id' },
    )
    .select('id')
    .single()
  if (approvalError) throw new AbhathliServiceError(approvalError.message)
  return { approval_id: (approval as { id: string }).id }
}

export async function executeApprovedAbhathliAction(input: {
  userId: string
  recommendationId: string
}): Promise<{ href: string | null; action: string; career_item_id: string }> {
  const supabase = await createClient()
  const client = asUntyped(supabase)
  const { data: rec, error: recError } = await client
    .from('abhathli_recommendations')
    .select('id, opportunity_id, payload')
    .eq('id', input.recommendationId)
    .eq('user_id', input.userId)
    .maybeSingle()
  if (recError || !rec) throw new AbhathliServiceError('التوصية غير موجودة', 404)
  const recommendation = (rec as { payload: AbhathliRecommendation }).payload

  const { data: approvalRow } = await client
    .from('abhathli_approvals')
    .select('id, recommendation_id, opportunity_id, action, approved, approved_at')
    .eq('recommendation_id', input.recommendationId)
    .eq('user_id', input.userId)
    .maybeSingle()

  try {
    const resolved = resolveApprovedAction({
      recommendation,
      approval: approvalRow
        ? {
            recommendation_id: input.recommendationId,
            opportunity_id: recommendation.opportunity_id,
            action: (approvalRow as { action: 'apply_native' | 'redirect_external' | 'track_only' }).action,
            approved: Boolean((approvalRow as { approved: boolean }).approved),
            approved_at: (approvalRow as { approved_at: string | null }).approved_at,
          }
        : null,
    })

    const parsed = parseOpportunityId(recommendation.opportunity_id)
    const careerItem = await ensureCareerItemFromOpportunity({
      userId: input.userId,
      opportunity: {
        opportunity_id: recommendation.opportunity_id,
        source_class: recommendation.source_class,
        title: { ar: recommendation.title_ar ?? undefined, en: recommendation.title_en ?? undefined },
        organization_name: recommendation.organization_name ?? undefined,
        expires_at: recommendation.expires_at ?? undefined,
        apply_authority: recommendation.apply_authority as OpportunityDiscoveryApplyAuthority,
        apply_url: recommendation.apply_url ?? undefined,
      },
    })

    if (resolved.action === 'redirect_external') {
      await markCareerItemApplied({
        userId: input.userId,
        itemId: careerItem.id,
        declaredExternal: true,
      })
    }

    if (parsed?.source_class === 'GOVERNED_EXTERNAL' && resolved.creates_internal_application) {
      throw new AbhathliBoundaryError(
        'EXTERNAL_APPLICATION_FORBIDDEN',
        'External opportunities must not create internal applications.',
      )
    }

    return {
      href: resolved.href,
      action: resolved.action,
      career_item_id: careerItem.id,
    }
  } catch (error) {
    if (error instanceof AbhathliBoundaryError) {
      throw new AbhathliServiceError(error.message, 403, error.code)
    }
    throw error
  }
}

export async function trackAbhathliRecommendation(input: {
  userId: string
  recommendationId: string
}): Promise<{ career_item_id: string }> {
  const supabase = await createClient()
  const client = asUntyped(supabase)
  const { data, error } = await client
    .from('abhathli_recommendations')
    .select('payload')
    .eq('id', input.recommendationId)
    .eq('user_id', input.userId)
    .maybeSingle()
  if (error || !data) throw new AbhathliServiceError('التوصية غير موجودة', 404)
  const recommendation = (data as { payload: AbhathliRecommendation }).payload
  const item = await ensureCareerItemFromOpportunity({
    userId: input.userId,
    opportunity: {
      opportunity_id: recommendation.opportunity_id,
      source_class: recommendation.source_class,
      title: { ar: recommendation.title_ar ?? undefined, en: recommendation.title_en ?? undefined },
      organization_name: recommendation.organization_name ?? undefined,
      expires_at: recommendation.expires_at ?? undefined,
      apply_authority: recommendation.apply_authority as OpportunityDiscoveryApplyAuthority,
      apply_url: recommendation.apply_url ?? undefined,
    },
  })
  return { career_item_id: item.id }
}
