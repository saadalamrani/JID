import { NextResponse } from 'next/server'
import { getBillingProvider, handlePaymentSucceeded } from '@/lib/billing'
import { recordBillingEventIdempotent } from '@/lib/billing/idempotency'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-moyasar-signature')

    const provider = getBillingProvider()
    const event = provider.verifyWebhook({ rawBody, signature })

    if (!event) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
    }

    const recorded = await recordBillingEventIdempotent({
      providerEventId: event.providerRef,
      eventType: event.eventType,
      payload: event.payload,
    })

    if (!recorded.inserted) {
      return NextResponse.json({ ok: true, duplicate: true })
    }

    if (!event.paid) {
      return NextResponse.json({ ok: true, handled: false })
    }

    const metadata = (event.payload.metadata ??
      (event.payload.invoice as Record<string, unknown> | undefined)?.metadata ??
      {}) as Record<string, string>

    const userId = metadata.user_id
    const billingCycle = metadata.billing_cycle === 'yearly' ? 'yearly' : 'monthly'
    const planKey = metadata.plan_key === 'jid_plus' ? 'jid_plus' : null

    if (!userId || planKey !== 'jid_plus') {
      return NextResponse.json({ ok: true, handled: false, reason: 'missing_metadata' })
    }

    await handlePaymentSucceeded({
      userId,
      planKey: 'jid_plus',
      billingCycle,
      providerRef: event.providerRef,
      payload: event.payload,
    })

    return NextResponse.json({ ok: true, handled: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
