import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>
type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: Client): UntypedClient {
  return client as unknown as UntypedClient
}

type NotifyAccountSuspendedInput = {
  userId: string
  reason: string
}

/**
 * TODO: Replace with `dispatch_notification({ category: 'account.suspended', channels: ['in_app', 'email'] })`
 * when `src/lib/notifications/` unified system is implemented.
 *
 * Current approach: best-effort queue to email_outbox for a future worker.
 */
export async function notifyAccountSuspended(
  client: Client,
  input: NotifyAccountSuspendedInput,
): Promise<void> {
  const payload = {
    user_id: input.userId,
    category: 'account.suspended',
    reason: input.reason.trim(),
  }

  const { error } = await asUntyped(client).from('email_outbox').insert({
    template: 'account.suspended',
    payload,
    status: 'pending',
  })

  if (error) {
    console.warn(
      '[account.suspended] notification queue failed — integrate dispatch_notification later:',
      error.message,
    )
  }
}
