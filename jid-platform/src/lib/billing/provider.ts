import type { BillingCycle } from '@/lib/monetization/types'

export type CheckoutSubject = {
  type: 'user'
  userId: string
  email: string | null
}

export type CreateCheckoutInput = {
  planKey: 'jid_plus'
  billingCycle: BillingCycle
  amountSar: number
  description: string
  successUrl: string
  callbackUrl: string
  metadata: Record<string, string>
  subject: CheckoutSubject
}

export type CreateCheckoutResult = {
  checkoutUrl: string
  providerRef: string
}

export type WebhookVerificationInput = {
  rawBody: string
  signature: string | null
}

export type WebhookEvent = {
  eventType: string
  providerRef: string
  payload: Record<string, unknown>
  paid: boolean
}

export interface BillingProvider {
  readonly name: string
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>
  verifyWebhook(input: WebhookVerificationInput): WebhookEvent | null
}
