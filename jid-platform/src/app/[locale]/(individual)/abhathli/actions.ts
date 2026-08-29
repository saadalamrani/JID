'use server'

import { revalidatePath } from 'next/cache'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import {
  approveAbhathliRecommendation,
  createAbhathliDraft,
  executeApprovedAbhathliAction,
  runAbhathliSearch,
  trackAbhathliRecommendation,
  AbhathliServiceError,
} from '@/lib/abhathli/service'
import type { AbhathliDraft, AbhathliMandateInput, AbhathliRecommendation } from '@/lib/abhathli/types'
import type { OpportunityDiscoveryFamily } from '@/lib/opportunity/discovery-types'

function revalidateAbhathli(): void {
  revalidatePath('/abhathli')
  revalidatePath('/en/abhathli')
  revalidatePath('/radar')
}

export async function searchWithAbhathliAction(input: {
  keywords: string
  families: OpportunityDiscoveryFamily[]
  cities: string
  remoteOnly: boolean
  useCareerRecord: boolean
}): Promise<
  | {
      ok: true
      runId: string
      recommendations: Array<AbhathliRecommendation & { recommendation_id: string }>
    }
  | { ok: false; error: string }
> {
  try {
    const userId = await requireAuthenticatedUser()
    const mandate: AbhathliMandateInput = {
      keywords: input.keywords
        .split(/[,\n،]/)
        .map((entry) => entry.trim())
        .filter(Boolean),
      families: input.families,
      cities: input.cities
        .split(/[,\n،]/)
        .map((entry) => entry.trim())
        .filter(Boolean),
      remote_only: input.remoteOnly,
      use_career_record: input.useCareerRecord,
    }
    const result = await runAbhathliSearch({ userId, mandate })
    revalidateAbhathli()
    return { ok: true, runId: result.runId, recommendations: result.recommendations }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'تعذر البحث' }
  }
}

export async function prepareAbhathliDraftAction(input: {
  recommendationId: string
}): Promise<{ ok: true; draft: AbhathliDraft & { draft_id: string } } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthenticatedUser()
    const draft = await createAbhathliDraft({ userId, recommendationId: input.recommendationId })
    return { ok: true, draft }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'تعذر تجهيز المسودة' }
  }
}

export async function approveAbhathliAction(input: {
  recommendationId: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthenticatedUser()
    await approveAbhathliRecommendation({ userId, recommendationId: input.recommendationId })
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'تعذر حفظ الموافقة' }
  }
}

export async function executeAbhathliAction(input: {
  recommendationId: string
}): Promise<{ ok: true; href: string | null; action: string; careerItemId: string } | { ok: false; error: string; code?: string }> {
  try {
    const userId = await requireAuthenticatedUser()
    const result = await executeApprovedAbhathliAction({
      userId,
      recommendationId: input.recommendationId,
    })
    revalidateAbhathli()
    return {
      ok: true,
      href: result.href,
      action: result.action,
      careerItemId: result.career_item_id,
    }
  } catch (error) {
    if (error instanceof AbhathliServiceError) {
      return { ok: false, error: error.message, code: error.code }
    }
    return { ok: false, error: error instanceof Error ? error.message : 'تعذر التنفيذ' }
  }
}

export async function trackAbhathliRecommendationAction(input: {
  recommendationId: string
}): Promise<{ ok: true; careerItemId: string } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthenticatedUser()
    const result = await trackAbhathliRecommendation({
      userId,
      recommendationId: input.recommendationId,
    })
    revalidateAbhathli()
    return { ok: true, careerItemId: result.career_item_id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'تعذر التتبع' }
  }
}
