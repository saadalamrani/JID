'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import { applyFlagContentHidden } from '@/lib/staff/content-flag-resolution'
import { fetchStaffFlagDetail } from '@/lib/staff/moderation-queries'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import { trackServer } from '@/lib/analytics/server'
import { resolveContentFlagSchema } from '@/lib/validations/staff'

export type ModerationActionResult = { ok: true } | { ok: false; error: string }

function revalidateModerationPaths(flagId: string) {
  revalidatePath('/staff/moderation')
  revalidatePath(`/staff/moderation/${flagId}`)
  revalidatePath('/staff')
}

async function writeFlagAuditLog(input: {
  actorId: string
  flagId: string
  action: string
  targetType: string
  targetId: string
  reason: string
  before: Record<string, unknown>
  after: Record<string, unknown>
}): Promise<ModerationActionResult | null> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('audit_logs').insert({
      actor_id: input.actorId,
      action: input.action,
      entity_type: 'content_flag',
      entity_id: input.flagId,
      old_data: input.before as Json,
      new_data: input.after as Json,
      metadata: {
        reason: input.reason.trim(),
        source: 'staff_portal',
        target_type: input.targetType,
        target_resource_id: input.targetId,
      } as Json,
    })
    if (error) return { ok: false, error: error.message }
    return null
  } catch {
    return null
  }
}

/** Section 10 — resolve flag and optionally hide target content (resolved_hidden). */
export async function resolveFlag(input: {
  flagId: string
  resolutionNotes: string
  hideContent?: boolean
}): Promise<ModerationActionResult> {
  const staff = await requireStaffShellAccess()
  const parsed = resolveContentFlagSchema.safeParse({
    flagId: input.flagId,
    status: 'resolved',
    resolutionNotes: input.resolutionNotes,
  })
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid resolution payload'
    return { ok: false, error: message }
  }

  const flag = await fetchStaffFlagDetail(parsed.data.flagId)
  if (!flag) return { ok: false, error: 'Flag not found' }
  if (!['pending', 'under_review'].includes(flag.status)) {
    return { ok: false, error: 'Flag is not open' }
  }

  const hide = Boolean(input.hideContent)
  const notes = hide
    ? `[hidden] ${parsed.data.resolutionNotes.trim()}`
    : parsed.data.resolutionNotes.trim()

  if (hide) {
    const hideResult = await applyFlagContentHidden(flag.target_type, flag.target_id)
    if (!hideResult.ok) return hideResult
  }

  const now = new Date().toISOString()
  const supabase = await createClient()
  const { error } = await supabase
    .from('content_flags')
    .update({
      status: 'resolved',
      resolution_notes: notes,
      reviewed_by: staff.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('id', flag.id)

  if (error) return { ok: false, error: error.message }

  await writeFlagAuditLog({
    actorId: staff.id,
    flagId: flag.id,
    action: hide ? 'content_flag.resolved_hidden' : 'content_flag.resolved',
    targetType: flag.target_type,
    targetId: flag.target_id,
    reason: parsed.data.resolutionNotes,
    before: { status: flag.status, resolution_notes: flag.resolution_notes },
    after: { status: 'resolved', resolution_notes: notes, hide_content: hide },
  })

  revalidateModerationPaths(flag.id)
  await trackServer('staff.flag_resolved', staff.id, {
    flag_id: flag.id,
    target_type: flag.target_type,
    resolution: hide ? 'resolved_hidden' : 'resolved',
  })
  return { ok: true }
}

/** Section 10 — dismiss flag without hiding content (resolved_dismissed). */
export async function dismissFlag(input: {
  flagId: string
  resolutionNotes: string
}): Promise<ModerationActionResult> {
  const staff = await requireStaffShellAccess()
  const parsed = resolveContentFlagSchema.safeParse({
    flagId: input.flagId,
    status: 'dismissed',
    resolutionNotes: input.resolutionNotes,
  })
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid dismiss payload'
    return { ok: false, error: message }
  }

  const flag = await fetchStaffFlagDetail(parsed.data.flagId)
  if (!flag) return { ok: false, error: 'Flag not found' }
  if (!['pending', 'under_review'].includes(flag.status)) {
    return { ok: false, error: 'Flag is not open' }
  }

  const notes = parsed.data.resolutionNotes.trim()
  const now = new Date().toISOString()
  const supabase = await createClient()
  const { error } = await supabase
    .from('content_flags')
    .update({
      status: 'dismissed',
      resolution_notes: notes,
      reviewed_by: staff.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('id', flag.id)

  if (error) return { ok: false, error: error.message }

  await writeFlagAuditLog({
    actorId: staff.id,
    flagId: flag.id,
    action: 'content_flag.dismissed',
    targetType: flag.target_type,
    targetId: flag.target_id,
    reason: notes,
    before: { status: flag.status },
    after: { status: 'dismissed', resolution_notes: notes },
  })

  revalidateModerationPaths(flag.id)
  await trackServer('staff.flag_resolved', staff.id, {
    flag_id: flag.id,
    target_type: flag.target_type,
    resolution: 'dismissed',
  })
  return { ok: true }
}
