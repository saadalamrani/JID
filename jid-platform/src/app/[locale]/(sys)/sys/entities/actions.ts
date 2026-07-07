'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  fetchLatestPendingClaimForEntity,
  fetchSysEntityDetail,
} from '@/lib/sys/entities-queries'
import {
  requireSuperAdminActor,
  validateReason,
  writeSysAuditLog,
  type SysActionResult,
} from '@/lib/sys/sys-actions-shared'
import type { SysEntityMetadataInput } from '@/types/sys-entities'

export type EntityActionResult = SysActionResult

function revalidateEntityPaths(entityId: string) {
  revalidatePath('/sys/entities')
  revalidatePath('/sys/entities/companies')
  revalidatePath('/sys/entities/universities')
  revalidatePath(`/sys/entities/${entityId}`)
}

/** Super Admin override — bypass staff claim review workflow. */
export async function forceApproveEntity(
  entityId: string,
  reason: string,
): Promise<EntityActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchSysEntityDetail(entityId)
  if (!before) return { ok: false, error: 'Entity not found' }

  const pendingClaim = await fetchLatestPendingClaimForEntity(entityId)
  const supabase = await createClient()
  const now = new Date().toISOString()

  const claimedBy = pendingClaim?.user_id ?? before.claimed_by

  const { error: entityError } = await supabase
    .from('companies')
    .update({
      entity_state: 'approved',
      is_verified: true,
      claimed_by: claimedBy,
      claim_requested_at: null,
      updated_at: now,
    })
    .eq('id', entityId)

  if (entityError) return { ok: false, error: entityError.message }

  if (pendingClaim) {
    const { error: claimError } = await supabase
      .from('claim_requests')
      .update({
        status: 'approved',
        review_notes: `[Super Admin override] ${reason.trim()}`,
        reviewed_by: actor.userId,
        reviewed_at: now,
        rejection_reason: null,
        updated_at: now,
      })
      .eq('id', pendingClaim.id)

    if (claimError) return { ok: false, error: claimError.message }

    const newRole = pendingClaim.claim_type === 'university' ? 'university_admin' : 'company_admin'
    const { error: roleError } = await supabase.rpc('set_user_role', {
      p_target_user_id: pendingClaim.user_id,
      p_new_role: newRole,
    })
    if (roleError) return { ok: false, error: roleError.message }
  }

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'entity.force_approved',
    entityType: 'company',
    entityId,
    reason,
    before: {
      entity_state: before.entity_state,
      is_verified: before.is_verified,
      claimed_by: before.claimed_by,
    },
    after: {
      entity_state: 'approved',
      is_verified: true,
      claimed_by: claimedBy,
    },
    extraMetadata: {
      super_admin_override: true,
      bypass_staff_review: true,
      claim_id: pendingClaim?.id ?? null,
      target_resource_id: entityId,
    },
  })
  if (auditError) return auditError

  revalidateEntityPaths(entityId)
  return { ok: true }
}

export async function forceRejectEntity(
  entityId: string,
  reason: string,
): Promise<EntityActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchSysEntityDetail(entityId)
  if (!before) return { ok: false, error: 'Entity not found' }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { error: entityError } = await supabase
    .from('companies')
    .update({
      entity_state: 'unclaimed',
      is_verified: false,
      claimed_by: null,
      claim_requested_at: null,
      updated_at: now,
    })
    .eq('id', entityId)

  if (entityError) return { ok: false, error: entityError.message }

  const { data: pendingClaims } = await supabase
    .from('claim_requests')
    .select('id, status')
    .eq('company_id', entityId)
    .in('status', ['pending', 'pending_review', 'under_review'])

  if (pendingClaims && pendingClaims.length > 0) {
    const { error: claimError } = await supabase
      .from('claim_requests')
      .update({
        status: 'rejected',
        review_notes: `[Super Admin override] ${reason.trim()}`,
        rejection_reason: reason.trim(),
        reviewed_by: actor.userId,
        reviewed_at: now,
        updated_at: now,
      })
      .in(
        'id',
        pendingClaims.map((c) => c.id),
      )

    if (claimError) return { ok: false, error: claimError.message }
  }

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'entity.force_rejected',
    entityType: 'company',
    entityId,
    reason,
    before: {
      entity_state: before.entity_state,
      is_verified: before.is_verified,
      claimed_by: before.claimed_by,
    },
    after: {
      entity_state: 'unclaimed',
      is_verified: false,
      claimed_by: null,
    },
    extraMetadata: {
      super_admin_override: true,
      bypass_staff_review: true,
      target_resource_id: entityId,
    },
  })
  if (auditError) return auditError

  revalidateEntityPaths(entityId)
  return { ok: true }
}

export async function updateEntityMetadata(
  entityId: string,
  metadata: SysEntityMetadataInput,
  reason: string,
): Promise<EntityActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchSysEntityDetail(entityId)
  if (!before) return { ok: false, error: 'Entity not found' }

  const updates: Record<string, string | null> = {}
  if (metadata.name !== undefined) updates.name = metadata.name.trim()
  if (metadata.name_ar !== undefined) updates.name_ar = metadata.name_ar
  if (metadata.website_url !== undefined) updates.website_url = metadata.website_url
  if (metadata.tagline_en !== undefined) updates.tagline_en = metadata.tagline_en
  if (metadata.tagline_ar !== undefined) updates.tagline_ar = metadata.tagline_ar
  if (metadata.description_en !== undefined) updates.description_en = metadata.description_en
  if (metadata.description_ar !== undefined) updates.description_ar = metadata.description_ar

  if (Object.keys(updates).length === 0) {
    return { ok: false, error: 'No metadata fields to update' }
  }

  updates.updated_at = new Date().toISOString()

  const supabase = await createClient()
  const { error } = await supabase.from('companies').update(updates).eq('id', entityId)
  if (error) return { ok: false, error: error.message }

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'entity.metadata_updated',
    entityType: 'company',
    entityId,
    reason,
    before: {
      name: before.name,
      name_ar: before.name_ar,
      website_url: before.website_url,
      tagline_en: before.tagline_en,
      tagline_ar: before.tagline_ar,
      description_en: before.description_en,
      description_ar: before.description_ar,
    },
    after: updates,
    extraMetadata: { target_resource_id: entityId },
  })
  if (auditError) return auditError

  revalidateEntityPaths(entityId)
  return { ok: true }
}
