import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>
type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: Client): UntypedClient {
  return client as unknown as UntypedClient
}

type NotifyApprovedInput = {
  userId: string
  slug: string | null
  reviewNotes: string
}

/**
 * TODO: Replace with `dispatch_notification({ category: 'mentor.application_approved' })`
 * when `src/lib/notifications/` unified system is implemented.
 *
 * Current approach: best-effort queue to email_outbox for a future worker.
 */
export async function notifyMentorApplicationApproved(
  client: Client,
  input: NotifyApprovedInput,
): Promise<void> {
  const payload = {
    user_id: input.userId,
    slug: input.slug,
    category: 'mentor.application_approved',
    review_notes: input.reviewNotes,
  }

  const { error } = await asUntyped(client).from('email_outbox').insert({
    template: 'mentor.application_approved',
    payload,
    status: 'pending',
  })

  if (error) {
    console.warn(
      '[mentor.application_approved] notification queue failed — integrate dispatch_notification later:',
      error.message,
    )
  }
}
