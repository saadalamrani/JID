import 'server-only'

import { activateCompanySubscription } from './subscription-service'
import type { BillingCycle } from '@/lib/monetization/types'

export type ManualCompanyActivationInput = {
  companyId: string
  planKey: 'employer_premium' | 'employer_enterprise'
  billingCycle: BillingCycle
  activatedBy: string
  reason: string
  periodEnd?: string
}

export async function activateCompanySubscriptionManual(
  input: ManualCompanyActivationInput,
): Promise<string> {
  return activateCompanySubscription(input)
}
