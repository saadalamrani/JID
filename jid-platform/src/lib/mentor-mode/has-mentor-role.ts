import 'server-only'

import { createClient } from '@/lib/supabase/server'

/**
 * Section 4.1 — approved mentor via mentor_profiles only (not RBAC role column).
 * Equivalent: EXISTS (SELECT 1 FROM mentor_profiles WHERE user_id = $1 AND status = 'approved')
 */
export async function hasApprovedMentorProfile(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mentor_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .maybeSingle()

  if (error) return false
  return Boolean(data)
}
