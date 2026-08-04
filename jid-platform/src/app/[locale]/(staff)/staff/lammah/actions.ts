'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireLammahStaffAccess } from '@/lib/staff/lammah-queries'

type UntypedClient = SupabaseClient<Record<string, unknown>>
export type LammahStaffActionResult = { ok: true; data?: Record<string, unknown> } | { ok: false; error: string }

function revalidateLammahPaths() {
  for (const path of [
    '/staff/lammah','/staff/lammah/review','/staff/lammah/mapping',
    '/staff/lammah/dead-letters','/staff/lammah/runs','/opportunities',
  ]) revalidatePath(path)
}

async function rpc(name: string, args: Record<string, unknown>): Promise<LammahStaffActionResult> {
  await requireLammahStaffAccess()
  const client=(await createClient()) as unknown as UntypedClient
  const {data,error}=await client.rpc(name,args)
  if(error) return {ok:false,error:error.message}
  const result=data as Record<string,unknown>|null
  if(result?.ok!==true) return {ok:false,error:String(result?.code??'lammah_action_failed')}
  revalidateLammahPaths()
  return {ok:true,data:result}
}

export async function claimLammahCandidate(candidateId:string) {
  return rpc('claim_lammah_candidate',{p_candidate_id:candidateId})
}

export async function releaseLammahCandidate(candidateId:string,reason:string) {
  return rpc('release_lammah_candidate',{p_candidate_id:candidateId,p_reason:reason})
}

export async function reviewLammahCandidate(input:{
  candidateId:string
  action:string
  notes:string
  correctedType?:string|null
  resolvedCompanyId?:string|null
}) {
  return rpc('review_lammah_candidate',{
    p_candidate_id:input.candidateId,p_action:input.action,p_notes:input.notes,
    p_corrected_type:input.correctedType??null,p_resolved_company_id:input.resolvedCompanyId??null,
  })
}

export async function reviewLammahFact(input:{
  factId:string
  action:'accept'|'reject'|'edit'
  normalizedValue?:unknown
  notesAr?:string|null
  notesEn?:string|null
}) {
  return rpc('review_lammah_fact',{
    p_fact_id:input.factId,p_action:input.action,
    p_normalized_value:input.normalizedValue??null,
    p_notes_ar:input.notesAr??null,p_notes_en:input.notesEn??null,
  })
}

export async function publishLammahCandidate(candidateId:string,notes:string) {
  return rpc('publish_lammah_candidate',{p_candidate_id:candidateId,p_notes:notes})
}

export async function transitionLammahOpportunity(opportunityId:string,action:string,reason:string) {
  return rpc('transition_lammah_opportunity',{
    p_opportunity_id:opportunityId,p_action:action,p_reason:reason,
  })
}

export async function configureLammahPhase1(input:{
  ingestionEnabled:boolean
  connectorEnabled:boolean
  autoPublicationEnabled:boolean
  sourceEnabled:boolean
  sourceAutoPublicationEnabled:boolean
  reason:string
}) {
  return rpc('configure_lammah_phase1',{
    p_ingestion_enabled:input.ingestionEnabled,
    p_connector_enabled:input.connectorEnabled,
    p_auto_publication_enabled:input.autoPublicationEnabled,
    p_source_enabled:input.sourceEnabled,
    p_source_auto_publication_enabled:input.sourceAutoPublicationEnabled,
    p_reason:input.reason,
  })
}

export async function redriveLammahDeadLetter(deadLetterId:string,reason:string) {
  return rpc('redrive_lammah_dead_letter',{p_dead_letter_id:deadLetterId,p_reason:reason})
}

export async function closeLammahDeadLetter(deadLetterId:string,reason:string) {
  return rpc('close_lammah_dead_letter',{p_dead_letter_id:deadLetterId,p_reason:reason})
}

export async function setLammahEvidenceLegalHold(evidenceId:string,enabled:boolean,reason:string) {
  return rpc('set_lammah_evidence_legal_hold',{
    p_evidence_id:evidenceId,p_enabled:enabled,p_reason:reason,
  })
}

export async function runLammahRetention(reason:string) {
  return rpc('run_lammah_retention_now',{p_reason:reason})
}
