'use client'

import { createClient } from '@/lib/supabase/client'
import type { UserSubscription } from './types'

function unwrapPlan<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export async function fetchMyJidPlusSubscription(): Promise<UserSubscription | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      `
      id,
      plan_id,
      billing_cycle,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      plans!inner(key, name_ar, name_en)
    `,
    )
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) return null

  const plan = unwrapPlan(data.plans)
  if (!plan || plan.key !== 'jid_plus') return null

  return {
    id: data.id,
    planId: data.plan_id,
    planKey: 'jid_plus',
    planNameAr: plan.name_ar,
    planNameEn: plan.name_en,
    billingCycle: data.billing_cycle,
    status: data.status,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  }
}
