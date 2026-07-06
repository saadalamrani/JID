import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { trackServer } from '@/lib/analytics/server'
import { queueApplicationRejectionEmails } from '@/lib/email/queue-application-rejection'

type Client = SupabaseClient<Database>

/**
 * Section 7.3 — queue + immediately invoke send-rejection-email (Section 9: <30s).
 * Outbox retained for retry via process-email-outbox cron.
 */
export async function dispatchApplicationRejectionEmails(
  client: Client,
  applicationIds: string[],
): Promise<{ queued: number; invoked: number }> {
  if (!applicationIds.length) return { queued: 0, invoked: 0 }

  const queued = await queueApplicationRejectionEmails(client, applicationIds)
  let invoked = 0

  const {
    data: { user },
  } = await client.auth.getUser()
  const actorId = user?.id ?? 'system'

  for (const applicationId of applicationIds) {
    const { error } = await client.functions.invoke('send-rejection-email', {
      body: { applicationId },
    })
    if (error) {
      console.error('send-rejection-email invoke failed:', applicationId, error.message)
      continue
    }
    invoked += 1
    void trackServer('rejection_email_sent', actorId, { application_id: applicationId })
  }

  return { queued, invoked }
}
