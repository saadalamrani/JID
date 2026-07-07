'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import { fetchStaffEntityDetail } from '@/lib/staff/entities-queries'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import { trackServer } from '@/lib/analytics/server'
import { staffEntityMetadataSchema } from '@/lib/validations/staff-entities'

export type StaffEntityActionResult = { ok: true } | { ok: false; error: string }

function revalidateEntityPaths(entityId: string) {
  revalidatePath('/staff/entities')
  revalidatePath('/staff/entities/flagged')
  revalidatePath(`/staff/entities/${entityId}`)
  revalidatePath(`/staff/entities/metadata-edit/${entityId}`)
}

async function writeEntityAuditLog(input: {
  actorId: string
  entityId: string
  reason: string
  before: Record<string, unknown>
  after: Record<string, unknown>
}): Promise<StaffEntityActionResult | null> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('audit_logs').insert({
      actor_id: input.actorId,
      action: 'entity.metadata_updated',
      entity_type: 'company',
      entity_id: input.entityId,
      old_data: input.before as Json,
      new_data: input.after as Json,
      metadata: {
        reason: input.reason.trim(),
        source: 'staff_portal',
        target_resource_id: input.entityId,
      } as Json,
    })
    if (error) return { ok: false, error: error.message }
    return null
  } catch {
    return { ok: false, error: 'Audit log failed' }
  }
}

/** Section 9 — staff metadata correction (never changes entity_state). */
export async function updateEntityMetadata(
  input: unknown,
): Promise<StaffEntityActionResult> {
  const staff = await requireStaffShellAccess()
  const parsed = staffEntityMetadataSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid metadata payload'
    return { ok: false, error: message }
  }

  const { entityId, sectorId, regionId, descriptionEn, descriptionAr, logoUrl, reason } =
    parsed.data

  const before = await fetchStaffEntityDetail(entityId)
  if (!before) return { ok: false, error: 'Entity not found or not in staff scope' }

  const logo = logoUrl?.trim() ? logoUrl.trim() : null
  const updates: Record<string, string | null> = {
    sector_id: sectorId,
    region_id: regionId,
    description_en: descriptionEn,
    description_ar: descriptionAr,
    logo_url: logo,
    updated_at: new Date().toISOString(),
  }

  const supabase = await createClient()
  const { error } = await supabase.from('companies').update(updates).eq('id', entityId)

  if (error) return { ok: false, error: error.message }

  const auditError = await writeEntityAuditLog({
    actorId: staff.id,
    entityId,
    reason,
    before: {
      sector_id: before.sector_id,
      region_id: before.region_id,
      description_en: before.description_en,
      description_ar: before.description_ar,
      logo_url: before.logo_url,
      entity_state: before.entity_state,
    },
    after: {
      ...updates,
      entity_state: before.entity_state,
    },
  })
  if (auditError) return auditError

  await trackServer('staff.entity_metadata_updated', staff.id, { entity_id: entityId })

  revalidateEntityPaths(entityId)
  return { ok: true }
}
