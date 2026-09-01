import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>
type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: Client): UntypedClient {
  return client as unknown as UntypedClient
}

type NotifyVerificationInput = {
  verificationId: string
  decision: 'approve' | 'reject' | 'needs_more_info'
}

/**
 * Queues an email_outbox row and invokes verification decision Edge Functions.
 * Categories use verification taxonomy (not organization-ownership claim names).
 */
export async function notifyVerificationDecision(
  client: Client,
  input: NotifyVerificationInput,
): Promise<void> {
  const category =
    input.decision === 'approve'
      ? 'verification.approved'
      : input.decision === 'reject'
        ? 'verification.rejected'
        : 'verification.needs_more_info'

  let rejectionReason: string | null = null
  if (input.decision === 'reject') {
    const { data } = await client
      .from('verification_requests')
      .select('rejection_reason')
      .eq('id', input.verificationId)
      .maybeSingle()
    rejectionReason = data?.rejection_reason ?? null
  }

  const payload = {
    verification_id: input.verificationId,
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
      body: { verificationId: input.verificationId },
    })
    if (emailError) {
      console.warn(`[${fn}] edge function failed:`, emailError.message)
    }
  }
}
