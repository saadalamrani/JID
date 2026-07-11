import 'server-only'

import { getPublicEnv } from '@/lib/env'
import type {
  BillingProvider,
  CreateCheckoutInput,
  CreateCheckoutResult,
  WebhookEvent,
  WebhookVerificationInput,
} from './provider'

const MOYASAR_API_BASE = 'https://api.moyasar.com/v1'

function getMoyasarSecretKey(): string | null {
  return process.env.MOYASAR_SECRET_KEY?.trim() || null
}

function sarToHalalas(amountSar: number): number {
  return Math.round(amountSar * 100)
}

type MoyasarInvoiceResponse = {
  id: string
  url: string
  status: string
}

export class MoyasarBillingProvider implements BillingProvider {
  readonly name = 'moyasar'

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const secretKey = getMoyasarSecretKey()
    if (!secretKey) {
      throw new Error('MOYASAR_SECRET_KEY is not configured')
    }

    const body = {
      amount: sarToHalalas(input.amountSar),
      currency: 'SAR',
      description: input.description,
      callback_url: input.callbackUrl,
      success_url: input.successUrl,
      metadata: {
        ...input.metadata,
        plan_key: input.planKey,
        billing_cycle: input.billingCycle,
        user_id: input.subject.userId,
      },
    }

    const response = await fetch(`${MOYASAR_API_BASE}/invoices`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const payload = (await response.json().catch(() => ({}))) as MoyasarInvoiceResponse & {
      message?: string
    }

    if (!response.ok || !payload.id || !payload.url) {
      throw new Error(payload.message ?? 'Moyasar checkout creation failed')
    }

    return {
      checkoutUrl: payload.url,
      providerRef: payload.id,
    }
  }

  verifyWebhook(input: WebhookVerificationInput): WebhookEvent | null {
    const secretKey = getMoyasarSecretKey()
    if (!secretKey) return null

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(input.rawBody) as Record<string, unknown>
    } catch {
      return null
    }

    const invoice = (parsed.invoice ?? parsed.data ?? parsed) as Record<string, unknown>
    const providerRef = String(invoice.id ?? parsed.id ?? '')
    if (!providerRef) return null

    const status = String(invoice.status ?? parsed.status ?? '').toLowerCase()
    const eventType = status === 'paid' ? 'payment_succeeded' : String(parsed.type ?? status)

    return {
      eventType,
      providerRef,
      payload: parsed,
      paid: status === 'paid',
    }
  }
}

export function buildMoyasarCallbackUrls(locale: 'ar' | 'en' = 'ar') {
  const { NEXT_PUBLIC_SITE_URL } = getPublicEnv()
  const base = NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  return {
    successUrl: `${base}/${locale}/plus?checkout=success`,
    callbackUrl: `${base}/api/billing/webhook`,
  }
}

export function getBillingProvider(): BillingProvider {
  return new MoyasarBillingProvider()
}

export function isMoyasarConfigured(): boolean {
  return Boolean(getMoyasarSecretKey())
}
