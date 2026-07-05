import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

export type StaffNotificationEvent = 'broken_link_7days'

export async function notifyStaff(
  supabase: SupabaseClient,
  companyId: string,
  eventType: StaffNotificationEvent,
): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: null,
    action: `catalog.${eventType}`,
    entity_type: 'company',
    entity_id: companyId,
    metadata: {
      notify: 'staff',
      event: eventType,
      source: 'link-auditor',
    },
  })

  if (error) {
    throw new Error(`notifyStaff failed: ${error.message}`)
  }
}
