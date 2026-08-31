import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'

export type BillingEventInsertResult = {
  inserted: boolean
  eventId: string | null
}

/**
 * Scale-readiness: webhook deliveries must be retry-safe.
 * Unique provider_event_id prevents double activation on replay.
 */
export async function recordBillingEventIdempotent(input: {
  providerEventId: string
  eventType: string
  subscriptionId?: string | null
  payload: Record<string, unknown>
}): Promise<BillingEventInsertResult> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('billing_events')
    .insert({
      subscription_id: input.subscriptionId ?? null,
      event_type: input.eventType,
      provider_event_id: input.providerEventId,
      payload: input.payload as Json,
    })
    .select('id')
    .maybeSingle()

  if (!error && data?.id) {
    return { inserted: true, eventId: data.id }
  }

  const duplicate =
    error?.code === '23505' ||
    (error?.message ?? '').toLowerCase().includes('duplicate') ||
    (error?.message ?? '').includes('billing_events_provider_event_id')

  if (duplicate) {
    const { data: existing } = await admin
      .from('billing_events')
      .select('id')
      .eq('provider_event_id', input.providerEventId)
      .maybeSingle()
    return { inserted: false, eventId: existing?.id ?? null }
  }

  if (error) throw new Error(error.message)
  return { inserted: false, eventId: null }
}
