import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { CONTACT_RATE_LIMIT } from '@/lib/contact/constants'

export class ContactRateLimitError extends Error {
  constructor() {
    super('contactPage.errors.rateLimited')
    this.name = 'ContactRateLimitError'
  }
}

type DevBucket = {
  count: number
  resetAt: number
}

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
    limiter: Ratelimit.slidingWindow(CONTACT_RATE_LIMIT.max, CONTACT_RATE_LIMIT.window),
    prefix: 'jid:contact',
    analytics: true,
  })
  return upstashLimiter
}

function assertDevRateLimit(ip: string): void {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000
  const bucket = devBuckets.get(ip)

  if (!bucket || bucket.resetAt <= now) {
    devBuckets.set(ip, { count: 1, resetAt: now + windowMs })
    return
  }

  if (bucket.count >= CONTACT_RATE_LIMIT.max) {
    throw new ContactRateLimitError()
  }

  bucket.count += 1
}

/** Section 9.2 — 3 messages per hour per IP. */
export async function assertContactRateLimit(ip: string): Promise<void> {
  const limiter = getUpstashLimiter()
  if (!limiter) {
    assertDevRateLimit(ip)
    return
  }

  const { success } = await limiter.limit(ip)
  if (!success) {
    throw new ContactRateLimitError()
  }
}

/** Test helper — reset in-memory buckets between unit checks. */
export function resetDevContactRateLimitBuckets(): void {
  devBuckets.clear()
}
