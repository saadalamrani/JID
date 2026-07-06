import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'

type OutboxRow = {
  id: string
  template: string
  payload: Record<string, unknown>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const supabase = createServiceClient()
    const limit = 25

    const { data: rows, error } = await supabase
      .from('email_outbox')
      .select('id, template, payload')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) return jsonResponse({ error: error.message }, 500)

    const pending = (rows ?? []) as OutboxRow[]
    let processed = 0
    let failed = 0

    const functionsUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    for (const row of pending) {
      const fn =
        row.template === 'application_expiry'
          ? 'send-expiry-notification'
          : 'send-rejection-email'

      const response = await fetch(`${functionsUrl}/functions/v1/${fn}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ outboxId: row.id }),
      })

      if (response.ok) {
        processed += 1
      } else {
        failed += 1
        const errText = await response.text()
        await supabase
          .from('email_outbox')
          .update({
            attempts: 1,
            last_error: errText.slice(0, 500),
            status: 'failed',
          })
          .eq('id', row.id)
      }
    }

    return jsonResponse({ processed, failed, scanned: pending.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return jsonResponse({ error: message }, 500)
  }
})
