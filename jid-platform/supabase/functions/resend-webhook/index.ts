import { Webhook } from 'https://esm.sh/svix@1.45.1'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'

type ResendWebhookPayload = {
  type?: string
  data?: {
    to?: string | string[]
    email_id?: string
    bounce?: { message?: string; type?: string }
    complaint?: { feedback_type?: string }
  }
}

function normalizeEmails(to: string | string[] | undefined): string[] {
  if (!to) return []
  const values = Array.isArray(to) ? to : [to]
  return values.map((email) => email.trim().toLowerCase()).filter(Boolean)
}

function verifySvixSignature(req: Request, rawBody: string): ResendWebhookPayload {
  const secret = Deno.env.get('RESEND_WEBHOOK_SECRET')
  if (!secret) {
    throw new Error('RESEND_WEBHOOK_SECRET is not configured')
  }

  const webhook = new Webhook(secret)
  return webhook.verify(rawBody, {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  }) as ResendWebhookPayload
}

async function upsertBounce(
  supabase: ReturnType<typeof createServiceClient>,
  email: string,
  bounceType: 'hard' | 'complaint',
  metadata: Record<string, unknown>,
) {
  const now = new Date().toISOString()
  const { data: existing } = await supabase
    .from('email_bounces')
    .select('id, bounce_count')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('email_bounces')
      .update({
        bounce_type: bounceType,
        last_bounced_at: now,
        bounce_count: (existing.bounce_count ?? 0) + 1,
        metadata,
      })
      .eq('id', existing.id)

    if (error) throw new Error(error.message)
    return
  }

  const { error } = await supabase.from('email_bounces').insert({
    email,
    bounce_type: bounceType,
    first_bounced_at: now,
    last_bounced_at: now,
    bounce_count: 1,
    metadata,
  })

  if (error) throw new Error(error.message)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const rawBody = await req.text()
    const payload = verifySvixSignature(req, rawBody)
    const eventType = payload.type ?? ''

    if (eventType !== 'email.bounced' && eventType !== 'email.complained') {
      return jsonResponse({ received: true, ignored: true, type: eventType })
    }

    const emails = normalizeEmails(payload.data?.to)
    if (emails.length === 0) {
      return jsonResponse({ received: true, ignored: true, reason: 'no_recipient' })
    }

    const supabase = createServiceClient()
    const bounceType =
      eventType === 'email.complained'
        ? 'complaint'
        : payload.data?.bounce?.type === 'hard' || eventType === 'email.bounced'
          ? 'hard'
          : null

    if (!bounceType) {
      console.info('resend-webhook: soft bounce ignored', { type: eventType })
      return jsonResponse({ received: true, ignored: true, reason: 'soft_bounce' })
    }

    const metadata = {
      event_type: eventType,
      email_id: payload.data?.email_id ?? null,
      bounce: payload.data?.bounce ?? null,
      complaint: payload.data?.complaint ?? null,
    }

    for (const email of emails) {
      await upsertBounce(supabase, email, bounceType, metadata)
      console.warn('resend-webhook: blacklisted email', { email, bounceType })
    }

    return jsonResponse({
      received: true,
      blacklisted: emails.length,
      bounce_type: bounceType,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed'
    console.error('resend-webhook: error', message)
    return jsonResponse({ error: message }, 400)
  }
})
