import 'server-only'

import type { SessionProfile } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { requireSysShellAccess } from '@/lib/sys/require-sys-access'

export type SysShellContext = {
  profile: SessionProfile
  email: string | undefined
  sessionIssuedAt: number | null
  maintenanceMode: boolean
  maintenanceMessage: string | null
}

type MaintenanceConfigValue = {
  enabled?: boolean
  message?: string
}

export async function fetchMaintenanceMode(): Promise<{
  enabled: boolean
  message: string | null
}> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('platform_config')
    .select('value')
    .eq('key', 'maintenance_mode')
    .maybeSingle()

  const value = (data?.value ?? {}) as MaintenanceConfigValue
  return {
    enabled: Boolean(value.enabled),
    message: typeof value.message === 'string' ? value.message : null,
  }
}

export async function getSysShellContext(): Promise<SysShellContext> {
  const profile = await requireSysShellAccess()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const sessionIssuedAt =
    typeof user?.last_sign_in_at === 'string'
      ? Math.floor(new Date(user.last_sign_in_at).getTime() / 1000)
      : null

  const maintenance = await fetchMaintenanceMode()

  return {
    profile,
    email: user?.email,
    sessionIssuedAt,
    maintenanceMode: maintenance.enabled,
    maintenanceMessage: maintenance.message,
  }
}
