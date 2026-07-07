import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { ContentFlagTargetType } from '@/lib/validations/staff'

type UntypedAdmin = ReturnType<typeof createAdminClient>

/**
 * Apply hide resolution for flagged content.
 * TODO: Wire `isContentFlagHidden()` into Catalog/Mentorship public queries so
 * resolved-hidden targets are excluded from anonymous listings.
 */
export async function applyFlagContentHidden(
  targetType: ContentFlagTargetType,
  targetId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = createAdminClient() as UntypedAdmin

    switch (targetType) {
      case 'profile': {
        const { error } = await (admin as unknown as {
          from: (table: 'profiles') => {
            update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> }
          }
        })
          .from('profiles')
          .update({ visibility: 'private', updated_at: new Date().toISOString() })
          .eq('id', targetId)
        if (error) return { ok: false, error: error.message }
        return { ok: true }
      }
      case 'mentor_profile': {
        const { error } = await admin
          .from('mentor_profiles')
          .update({
            is_accepting_requests: false,
            status: 'suspended',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', targetId)
        if (error) return { ok: false, error: error.message }
        return { ok: true }
      }
      case 'job': {
        const { error } = await admin
          .from('jobs')
          .update({ status: 'closed', updated_at: new Date().toISOString() })
          .eq('id', targetId)
        if (error) return { ok: false, error: error.message }
        return { ok: true }
      }
      case 'company':
      case 'announcement':
      case 'message':
        console.warn(
          `[content_flags] hide resolution for ${targetType} — display gating TODO in Catalog sprint`,
        )
        return { ok: true }
      default:
        return { ok: false, error: 'Unsupported target type' }
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to hide content',
    }
  }
}

/** Check whether target has a resolved flag marked hidden (for future public gating). */
export async function hasResolvedHiddenFlag(
  targetType: ContentFlagTargetType,
  targetId: string,
): Promise<boolean> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from('content_flags')
    .select('id', { count: 'exact', head: true })
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('status', 'resolved')
    .ilike('resolution_notes', '[hidden]%')

  if (error) return false
  return (count ?? 0) > 0
}
