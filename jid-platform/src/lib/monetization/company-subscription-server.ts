import type { BillingCycle } from '@/lib/monetization/types'

export type CompanySubscriptionSummary = {
  id: string
  planKey: string
  planNameAr: string
  planNameEn: string
  billingCycle: BillingCycle
  status: string
  currentPeriodEnd: string
}

function unwrapPlan<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export async function fetchCompanySubscriptionSummary(
  companyId: string,
): Promise<CompanySubscriptionSummary | null> {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      `
      id,
      billing_cycle,
      status,
      current_period_end,
      plans!inner(key, name_ar, name_en)
    `,
    )
    .eq('company_id', companyId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const plan = unwrapPlan(data.plans)
  if (!plan) return null

  return {
    id: data.id,
    planKey: plan.key,
    planNameAr: plan.name_ar,
    planNameEn: plan.name_en,
    billingCycle: data.billing_cycle,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
  }
}
