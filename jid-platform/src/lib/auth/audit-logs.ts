import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

export type AuditLogRow = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  actor_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export async function fetchStaffAuditLogs(supabase: Client, limit = 50): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, actor_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as AuditLogRow[]
}

export async function fetchSysAuditLogs(supabase: Client, limit = 100): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, actor_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as AuditLogRow[]
}
