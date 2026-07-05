/**
 * Middleware audit logging — Section 5 / Section 11 Step 4
 *
 * Uses service-role client (Edge-safe) because audit_logs has no direct INSERT RLS policy.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { UserRole } from './rbac'

export type ActivityLogInput = {
  actorId: string
  actorRole: UserRole
  path: string
  method: string
  ipAddress?: string | null
  userAgent?: string | null
}

function createAuditClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return null
  }

  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Record a middleware route access event in audit_logs.
 * Failures are swallowed so logging never blocks navigation.
 */
export async function logActivity(input: ActivityLogInput): Promise<void> {
  try {
    const supabase = createAuditClient()
    if (!supabase) return

    await supabase.from('audit_logs').insert({
      actor_id: input.actorId,
      action: 'route.access',
      entity_type: 'route',
      entity_id: null,
      metadata: {
        path: input.path,
        method: input.method,
        actor_role: input.actorRole,
        source: 'middleware',
      },
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    })
  } catch {
    // Audit must never break the request pipeline
  }
}
