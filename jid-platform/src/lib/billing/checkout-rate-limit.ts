import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export class CheckoutRateLimitError extends Error {
  constructor() {
    super('checkout_rate_limited')
    this.name = 'CheckoutRateLimitError'
  }
}

type DevBucket = {
  count: number
  resetAt: number
}

const MAX_PER_HOUR = 8
let upstashLimiter: Ratelimit | null | undefined
const devBuckets = new Map<string, DevBucket>()

function getUpstashLimiter(): Ratelimit | null {
  if (upstashLimiter !== undefined) return upstashLimiter
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    upstashLimiter = null
    return null
  }
  upstashLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_PER_HOUR, '1 h'),
    prefix: 'jid:checkout',
    analytics: true,
  })
  return upstashLimiter
}

function assertDevRateLimit(key: string): void {
  const now = Date.now()
  const bucket = devBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    devBuckets.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return
  }
  if (bucket.count >= MAX_PER_HOUR) {
    throw new CheckoutRateLimitError()
  }
  bucket.count += 1
}

export async function assertCheckoutRateLimit(key: string): Promise<void> {
  const limiter = getUpstashLimiter()
  if (!limiter) {
    assertDevRateLimit(key)
    return
  }
  const { success } = await limiter.limit(key)
  if (!success) throw new CheckoutRateLimitError()
}

export function resetDevCheckoutRateLimitBuckets(): void {
  devBuckets.clear()
}
