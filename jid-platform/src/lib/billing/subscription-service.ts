import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'
import type { BillingCycle } from '@/lib/monetization/types'

type PlanRow = {
  id: string
  key: string
  audience: 'user' | 'company'
}

function periodEndFromCycle(cycle: BillingCycle, from = new Date()): string {
  const end = new Date(from)
  if (cycle === 'yearly') {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return end.toISOString()
}

async function fetchPlanByKey(planKey: string): Promise<PlanRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('plans')
    .select('id, key, audience')
    .eq('key', planKey)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

async function appendBillingEvent(input: {
  subscriptionId: string | null
  eventType: string
  payload: Record<string, unknown>
}) {
  const admin = createAdminClient()
  const { error } = await admin.from('billing_events').insert({
    subscription_id: input.subscriptionId,
    event_type: input.eventType,
    payload: input.payload as Json,
  })
  if (error) throw new Error(error.message)
}

export async function activateUserSubscription(input: {
  userId: string
  planKey: 'jid_plus'
  billingCycle: BillingCycle
  paymentProvider: string
  providerRef: string
  periodEnd?: string
}): Promise<string> {
  const plan = await fetchPlanByKey(input.planKey)
  if (!plan || plan.audience !== 'user') {
    throw new Error(`Plan not found: ${input.planKey}`)
  }

  const admin = createAdminClient()
  const periodEnd = input.periodEnd ?? periodEndFromCycle(input.billingCycle)
  const now = new Date().toISOString()

  await admin
    .from('subscriptions')
    .update({ status: 'canceled', updated_at: now })
    .eq('user_id', input.userId)
    .in('status', ['active', 'trialing', 'past_due'])

  const { data, error } = await admin
    .from('subscriptions')
    .insert({
      subscriber_type: 'user',
      user_id: input.userId,
      company_id: null,
      plan_id: plan.id,
      billing_cycle: input.billingCycle,
      status: 'active',
      current_period_start: now,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      payment_provider: input.paymentProvider,
      provider_ref: input.providerRef,
      updated_at: now,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await appendBillingEvent({
    subscriptionId: data.id,
    eventType: 'activated',
    payload: {
      plan_key: input.planKey,
      billing_cycle: input.billingCycle,
      provider: input.paymentProvider,
      provider_ref: input.providerRef,
    },
  })

  return data.id
}

export async function activateCompanySubscription(input: {
  companyId: string
  planKey: 'employer_premium' | 'employer_enterprise'
  billingCycle: BillingCycle
  activatedBy: string
  periodEnd?: string
  reason: string
}): Promise<string> {
  const plan = await fetchPlanByKey(input.planKey)
  if (!plan || plan.audience !== 'company') {
    throw new Error(`Plan not found: ${input.planKey}`)
  }

  const admin = createAdminClient()
  const periodEnd = input.periodEnd ?? periodEndFromCycle(input.billingCycle)
  const now = new Date().toISOString()

  await admin
    .from('subscriptions')
    .update({ status: 'canceled', updated_at: now })
    .eq('company_id', input.companyId)
    .in('status', ['active', 'trialing', 'past_due'])

  const { data, error } = await admin
    .from('subscriptions')
    .insert({
      subscriber_type: 'company',
      user_id: null,
      company_id: input.companyId,
      plan_id: plan.id,
      billing_cycle: input.billingCycle,
      status: 'active',
      current_period_start: now,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      payment_provider: 'manual_invoice',
      provider_ref: null,
      activated_by: input.activatedBy,
      updated_at: now,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await appendBillingEvent({
    subscriptionId: data.id,
    eventType: 'activated',
    payload: {
      plan_key: input.planKey,
      billing_cycle: input.billingCycle,
      provider: 'manual_invoice',
      activated_by: input.activatedBy,
      reason: input.reason,
    },
  })

  return data.id
}

export async function setSubscriptionCancelAtPeriodEnd(input: {
  subscriptionId: string
  userId: string
  cancelAtPeriodEnd: boolean
}): Promise<void> {
  const admin = createAdminClient()

  const { data: row, error: fetchError } = await admin
    .from('subscriptions')
    .select('id, user_id, status')
    .eq('id', input.subscriptionId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!row || row.user_id !== input.userId) {
    throw new Error('Subscription not found')
  }
  if (!['active', 'trialing', 'past_due'].includes(row.status)) {
    throw new Error('Subscription cannot be updated')
  }

  const { error } = await admin
    .from('subscriptions')
    .update({
      cancel_at_period_end: input.cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.subscriptionId)

  if (error) throw new Error(error.message)

  await appendBillingEvent({
    subscriptionId: input.subscriptionId,
    eventType: input.cancelAtPeriodEnd ? 'canceled' : 'renewed',
    payload: { cancel_at_period_end: input.cancelAtPeriodEnd },
  })
}

export async function handlePaymentSucceeded(input: {
  userId: string
  planKey: 'jid_plus'
  billingCycle: BillingCycle
  providerRef: string
  payload: Record<string, unknown>
}): Promise<string> {
  const subscriptionId = await activateUserSubscription({
    userId: input.userId,
    planKey: input.planKey,
    billingCycle: input.billingCycle,
    paymentProvider: 'moyasar',
    providerRef: input.providerRef,
  })

  await appendBillingEvent({
    subscriptionId,
    eventType: 'payment_succeeded',
    payload: input.payload,
  })

  return subscriptionId
}
