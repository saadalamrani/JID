import { describe, expect, it } from 'vitest'
import {
  assertCheckoutRateLimit,
  CheckoutRateLimitError,
  resetDevCheckoutRateLimitBuckets,
} from '@/lib/billing/checkout-rate-limit'

describe('Wave 14 checkout rate limit', () => {
  it('bounds repeated checkout attempts', async () => {
    resetDevCheckoutRateLimitBuckets()
    for (let index = 0; index < 8; index += 1) {
      await assertCheckoutRateLimit('user-a')
    }
    await expect(assertCheckoutRateLimit('user-a')).rejects.toBeInstanceOf(CheckoutRateLimitError)
    await expect(assertCheckoutRateLimit('user-b')).resolves.toBeUndefined()
  })
})
