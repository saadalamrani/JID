import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { AssessmentAction } from '@/types/contracts/assessment-orchestration'

type RpcError = { message: string }
type RpcResult = Promise<{ data: string | null; error: RpcError | null }>
type GenericRpc = (name: string, args: Record<string, unknown>) => RpcResult

async function rpc(): Promise<GenericRpc> {
  const client = await createClient()
  return client.rpc as unknown as GenericRpc
}

async function invoke(name: string, args: Record<string, unknown>): Promise<string> {
  const call = await rpc()
  const { data, error } = await call(name, args)
  if (error || !data) throw new Error(error?.message ?? 'تعذّر تنفيذ عملية التقييم')
  return data
}

export function assignAssessment(methodId: string, applicationId: string, stageId?: string | null) {
  return invoke('assign_assessment', { p_method_id: methodId, p_application_id: applicationId, p_stage_id: stageId ?? null })
}

export function transitionAssessment(input: {
  assignmentId: string
  action: AssessmentAction
  termsRef?: string | null
  providerSessionRef?: string | null
  recordingRef?: string | null
  failureCode?: string | null
  reason?: string | null
}) {
  return invoke('transition_assessment_assignment', {
    p_assignment_id: input.assignmentId, p_action: input.action,
    p_terms_ref: input.termsRef ?? null, p_provider_session_ref: input.providerSessionRef ?? null,
    p_recording_ref: input.recordingRef ?? null, p_failure_code: input.failureCode ?? null,
    p_reason: input.reason ?? null,
  })
}

export function retryAssessment(assignmentId: string) {
  return invoke('retry_assessment_assignment', { p_assignment_id: assignmentId })
}

export function ingestAssessmentResult(input: {
  assignmentId: string
  criterionId: string
  payload: Record<string, unknown>
  summaryAr?: string | null
  summaryEn?: string | null
  limitations?: unknown[]
  provenanceRef: string
}) {
  return invoke('ingest_assessment_result', {
    p_assignment_id: input.assignmentId, p_criterion_id: input.criterionId,
    p_payload: input.payload, p_summary_ar: input.summaryAr ?? null,
    p_summary_en: input.summaryEn ?? null, p_limitations: input.limitations ?? [],
    p_provenance_ref: input.provenanceRef,
  })
}

