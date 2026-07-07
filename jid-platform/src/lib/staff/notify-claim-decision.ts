import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>
type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: Client): UntypedClient {
  return client as unknown as UntypedClient
}

type NotifyClaimInput = {
  claimId: string
  decision: 'approve' | 'reject' | 'needs_more_info'
}

/**
 * TODO: Replace with `dispatch_notification()` from `src/lib/notifications/` when the
 * Unified Notifications sprint lands (in-app bell + email for high-priority).
 *
 * Current approach: email_outbox queue + claim edge functions.
 */
export async function notifyClaimDecision(client: Client, input: NotifyClaimInput): Promise<void> {
  const category =
    input.decision === 'approve'
      ? 'claim.approved'
      : input.decision === 'reject'
        ? 'claim.rejected'
        : 'claim.needs_more_info'

  let rejectionReason: string | null = null
  if (input.decision === 'reject') {
    const { data } = await client
      .from('claim_requests')
      .select('rejection_reason')
      .eq('id', input.claimId)
      .maybeSingle()
    rejectionReason = data?.rejection_reason ?? null
  }

  const payload = {
    claim_id: input.claimId,
    decision: input.decision,
    category,
    ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
  }

  const { error } = await asUntyped(client).from('email_outbox').insert({
    template: category,
    payload,
    status: 'pending',
  })

  if (error) {
    console.warn(
      `[${category}] notification queue failed — integrate dispatch_notification later:`,
      error.message,
    )
  }

  if (input.decision === 'approve' || input.decision === 'reject') {
    const fn = input.decision === 'approve' ? 'send-claim-approval' : 'send-claim-rejection'
    const { error: emailError } = await client.functions.invoke(fn, {
      body: { claimId: input.claimId },
    })
    if (emailError) {
      console.warn(`[${fn}] edge function failed:`, emailError.message)
    }
  }
}
