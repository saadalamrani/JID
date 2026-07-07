import 'server-only'

import type { SessionProfile } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'

export type StaffShellContext = {
  profile: SessionProfile
  email: string | undefined
  sessionIssuedAt: number | null
}

export async function getStaffShellContext(): Promise<StaffShellContext> {
  const profile = await requireStaffShellAccess()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const sessionIssuedAt =
    typeof user?.last_sign_in_at === 'string'
      ? Math.floor(new Date(user.last_sign_in_at).getTime() / 1000)
      : null

  return {
    profile,
    email: user?.email,
    sessionIssuedAt,
  }
}
