'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import type { Database } from '@/lib/supabase/types'

type UntypedClient = SupabaseClient<Record<string, unknown>>
export type Wave10StaffActionResult = { ok: true } | { ok: false; error: string }

function untyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

async function staffRpc(name: string, args: Record<string, unknown>): Promise<Wave10StaffActionResult> {
  await requireStaffShellAccess()
  const client = untyped(await createClient())
  const { error } = await client.rpc(name, args)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/staff/universities')
  revalidatePath('/university/dashboard')
  return { ok: true }
}

export async function staffCreateUniversityIdentityMapping(input: {
  catalogUniversityId: string
  directoryId: string
  auditReason: string
  auditReference?: string
}): Promise<Wave10StaffActionResult> {
  return staffRpc('create_university_identity_mapping', {
    p_catalog_university_id: input.catalogUniversityId,
    p_directory_id: input.directoryId,
    p_audit_reason: input.auditReason,
    p_audit_reference: input.auditReference ?? null,
  })
}

export async function staffRevokeUniversityIdentityMapping(
  mappingId: string,
  auditReason: string,
): Promise<Wave10StaffActionResult> {
  return staffRpc('revoke_university_identity_mapping', {
    p_mapping_id: mappingId,
    p_audit_reason: auditReason,
  })
}

export async function staffReviewUniversityAffiliation(input: {
  affiliationId: string
  decision: 'VERIFIED' | 'NEEDS_REVIEW'
  reason: string
}): Promise<Wave10StaffActionResult> {
  return staffRpc('staff_review_university_affiliation', {
    p_affiliation_id: input.affiliationId,
    p_decision: input.decision,
    p_reason: input.reason,
    p_verification_method: 'MANUAL_REVIEW',
  })
}
