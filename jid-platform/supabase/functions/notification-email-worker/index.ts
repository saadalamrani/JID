import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import {
  fetchPendingNotificationIds,
  processNotificationEmail,
} from '../_shared/notification-email-processor.ts'
import { createServiceClient } from '../_shared/supabase.ts'

type WorkerBody = {
  batch?: boolean
  notification_id?: string
}

const BATCH_LIMIT = 25

function isAuthorizedServiceRequest(req: Request): boolean {
  const authHeader = req.headers.get('Authorization') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  return Boolean(serviceKey) && authHeader === `Bearer ${serviceKey}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  if (!isAuthorizedServiceRequest(req)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  try {
    const supabase = createServiceClient()

    const { data: quotaRows, error: quotaError } = await supabase.rpc('email_quota_status')
    if (quotaError) {
      console.error('notification-email-worker: quota check failed', quotaError.message)
      return jsonResponse({ error: quotaError.message }, 500)
    }

    const quota = (quotaRows ?? [])[0] as
      | { circuit_open?: boolean; sent_today?: number; daily_limit?: number }
      | undefined

    if (quota?.circuit_open) {
      console.warn('notification-email-worker: circuit open — quota exhausted', {
        sent_today: quota.sent_today,
        daily_limit: quota.daily_limit,
      })
      return jsonResponse({ skipped: true, reason: 'quota_exhausted' }, 200)
    }

    const body = (await req.json().catch(() => ({}))) as WorkerBody
    const notificationId = body.notification_id?.trim()
    const isBatch = body.batch === true

    if (!isBatch && !notificationId) {
      return jsonResponse({ error: 'notification_id required unless batch=true' }, 400)
    }

    const targetIds = isBatch
      ? await fetchPendingNotificationIds(supabase, BATCH_LIMIT)
      : [notificationId as string]

    const results = []
    for (const id of targetIds) {
      results.push(await processNotificationEmail(supabase, id))
    }

    const summary = {
      processed: results.length,
      sent: results.filter((r) => r.status === 'sent').length,
      skipped_prefs: results.filter((r) => r.status === 'skipped_prefs').length,
      skipped_bounced: results.filter((r) => r.status === 'skipped_bounced').length,
      skipped_duplicate: results.filter((r) => r.status === 'skipped_duplicate').length,
      failed: results.filter((r) => r.status === 'failed').length,
      batch: isBatch,
      results,
    }

    return jsonResponse(summary)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    console.error('notification-email-worker: unhandled error', message)
    return jsonResponse({ error: message }, 500)
  }
})
