import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { AssessmentMethod } from '@/types/contracts/hiring-evidence'
import { checkAiAction } from './evidence-authority'

/**
 * Server-only thin wrappers over the Wave 6 hiring-evidence RPCs. All
 * authorization, tenant isolation, and state-machine rules live in the database
 * (SECURITY DEFINER functions + RLS). These wrappers only shape arguments and
 * surface bilingual errors.
 */

type RpcError = { message: string }
type RpcResult<T> = Promise<{ data: T | null; error: RpcError | null }>
type GenericRpc = (name: string, args: Record<string, unknown>) => RpcResult<string>

const DB_METHOD: Record<AssessmentMethod, string> = {
  STRUCTURED_SCREENING: 'structured_screening',
  WORK_SAMPLE: 'work_sample',
  STRUCTURED_INTERVIEW: 'structured_interview',
  REFERENCE_CHECK: 'reference_check',
  PORTFOLIO_REVIEW: 'portfolio_review',
}

async function rpc(): Promise<GenericRpc> {
  const client = await createClient()
  return client.rpc as unknown as GenericRpc
}

export async function publishRubricVersion(input: {
  rubricId: string
  scalePoints: 3 | 4 | 5
  anchors: { point: number; descriptorAr: string; descriptorEn: string }[]
}): Promise<string> {
  const call = await rpc()
  const { data, error } = await call('publish_hiring_rubric_version', {
    p_rubric_id: input.rubricId,
    p_scale_points: input.scalePoints,
    p_anchors: input.anchors.map((a) => ({
      point: a.point,
      descriptor_ar: a.descriptorAr,
      descriptor_en: a.descriptorEn,
    })),
  })
  if (error || !data) throw new Error(error?.message ?? 'تعذّر نشر نسخة المعيار')
  return data
}

export async function recordObservation(input: {
  applicationId: string
  criterionId: string
  method: AssessmentMethod
  source: 'structured_screening' | 'work_sample' | 'interview_session' | 'reference_check'
  sourceTable: string
  sourceId: string
  evidenceFound: boolean
  stageId?: string | null
  noteAr?: string | null
  noteEn?: string | null
  citations?: { label: string; href: string }[]
  planItemId?: string | null
  workSampleTaskId?: string | null
  supersedesObservationId?: string | null
}): Promise<string> {
  const call = await rpc()
  const { data, error } = await call('record_hiring_observation', {
    p_application_id: input.applicationId,
    p_criterion_id: input.criterionId,
    p_method: DB_METHOD[input.method],
    p_source: input.source,
    p_source_table: input.sourceTable,
    p_source_id: input.sourceId,
    p_evidence_found: input.evidenceFound,
    p_stage_id: input.stageId ?? null,
    p_note_ar: input.noteAr ?? null,
    p_note_en: input.noteEn ?? null,
    p_citations: input.citations ?? [],
    p_plan_item_id: input.planItemId ?? null,
    p_work_sample_task_id: input.workSampleTaskId ?? null,
    p_supersedes_observation_id: input.supersedesObservationId ?? null,
  })
  if (error || !data) throw new Error(error?.message ?? 'تعذّر تسجيل الملاحظة')
  return data
}

export async function recordRating(input: {
  observationId: string
  rubricVersionId: string
  anchorPoint: number | null
  rationaleAr?: string | null
  rationaleEn?: string | null
  supersedesRatingId?: string | null
}): Promise<string> {
  const call = await rpc()
  const { data, error } = await call('record_hiring_rating', {
    p_observation_id: input.observationId,
    p_rubric_version_id: input.rubricVersionId,
    p_anchor_point: input.anchorPoint,
    p_rationale_ar: input.rationaleAr ?? null,
    p_rationale_en: input.rationaleEn ?? null,
    p_supersedes_rating_id: input.supersedesRatingId ?? null,
  })
  if (error || !data) throw new Error(error?.message ?? 'تعذّر تسجيل التقييم')
  return data
}

export async function submitScorecard(scorecardId: string): Promise<string> {
  const call = await rpc()
  const { data, error } = await call('submit_hiring_scorecard', { p_scorecard_id: scorecardId })
  if (error || !data) throw new Error(error?.message ?? 'تعذّر اعتماد بطاقة التقييم')
  return data
}

export async function assignWorkSample(input: {
  taskId: string
  applicationId: string
  dueAt?: string | null
}): Promise<string> {
  const call = await rpc()
  const { data, error } = await call('assign_work_sample', {
    p_task_id: input.taskId,
    p_application_id: input.applicationId,
    p_due_at: input.dueAt ?? null,
  })
  if (error || !data) throw new Error(error?.message ?? 'تعذّر إسناد نموذج العمل')
  return data
}

export async function submitWorkSample(input: {
  submissionId: string
  artifactRefs: { label: string; href: string }[]
  noteAr?: string | null
  noteEn?: string | null
  termsRef?: string | null
}): Promise<string> {
  const call = await rpc()
  const { data, error } = await call('submit_work_sample', {
    p_submission_id: input.submissionId,
    p_artifact_refs: input.artifactRefs,
    p_note_ar: input.noteAr ?? null,
    p_note_en: input.noteEn ?? null,
    p_terms_ref: input.termsRef ?? null,
  })
  if (error || !data) throw new Error(error?.message ?? 'تعذّر إرسال نموذج العمل')
  return data
}

export async function withdrawWorkSample(submissionId: string): Promise<string> {
  const call = await rpc()
  const { data, error } = await call('withdraw_work_sample', { p_submission_id: submissionId })
  if (error || !data) throw new Error(error?.message ?? 'تعذّر سحب نموذج العمل')
  return data
}

/**
 * Generate decision support. `aiAssist` is only accepted for the enumerated
 * permitted AI actions and only with a human requester; the payload can never
 * carry a recommended outcome (there is no such parameter).
 */
export async function generateDecisionSupport(input: {
  applicationId: string
  stageId: string | null
  summaryAr: string | null
  summaryEn: string | null
  missingEvidence?: unknown[]
  inconsistencies?: unknown[]
  aiAssist?: { action: string; humanRequesterId: string; modelRef: string } | null
}): Promise<string> {
  let aiAssistRef: { model_ref: string; generated_at: string } | null = null
  if (input.aiAssist) {
    const check = checkAiAction({
      action: input.aiAssist.action,
      humanRequesterId: input.aiAssist.humanRequesterId,
    })
    if (!check.allowed) {
      throw new Error(`AI authority boundary: ${check.reason}`)
    }
    aiAssistRef = { model_ref: input.aiAssist.modelRef, generated_at: new Date().toISOString() }
  }

  const call = await rpc()
  const { data, error } = await call('generate_hiring_decision_support', {
    p_application_id: input.applicationId,
    p_stage_id: input.stageId,
    p_summary_ar: input.summaryAr,
    p_summary_en: input.summaryEn,
    p_missing_evidence: input.missingEvidence ?? [],
    p_inconsistencies: input.inconsistencies ?? [],
    p_ai_assist_ref: aiAssistRef,
  })
  if (error || !data) throw new Error(error?.message ?? 'تعذّر إنشاء ملخص دعم القرار')
  return data
}
