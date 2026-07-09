import type { Model1FeatureKey } from './feature-keys'

export type BillingCycle = 'monthly' | 'yearly'

export type OpportunityTier = 'normal' | 'plus'

export type UserEntitlement = {
  featureKey: Model1FeatureKey
  quota: number | null
}

export type JidPlusPlan = {
  id: string
  key: 'jid_plus'
  nameAr: string
  nameEn: string
  priceMonthlySar: number
  priceYearlySar: number
}

export type UserSubscription = {
  id: string
  planId: string
  planKey: 'jid_plus'
  planNameAr: string
  planNameEn: string
  billingCycle: BillingCycle
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}
