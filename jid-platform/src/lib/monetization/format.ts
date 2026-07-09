'use client'

import type { BillingCycle } from './types'

/** Latin digits for SAR display (Prompt 0 / platform convention). */
export function formatSarAmount(amount: number, locale: 'ar' | 'en'): string {
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

  return locale === 'ar' ? `${formatted} ر.س` : `SAR ${formatted}`
}

export function computeYearlySavingsPercent(monthly: number, yearly: number): number {
  if (monthly <= 0) return 0
  const annualizedMonthly = monthly * 12
  if (annualizedMonthly <= yearly) return 0
  return Math.round(((annualizedMonthly - yearly) / annualizedMonthly) * 100)
}

export function priceForCycle(
  plan: { priceMonthlySar: number; priceYearlySar: number },
  cycle: BillingCycle,
): number {
  return cycle === 'yearly' ? plan.priceYearlySar : plan.priceMonthlySar
}
