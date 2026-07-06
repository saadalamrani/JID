'use client'

/**
 * Section 14 — lightweight PostHog capture (no SDK required).
 * Set NEXT_PUBLIC_POSTHOG_KEY + optional NEXT_PUBLIC_POSTHOG_HOST.
 */

export const ANALYTICS_EVENTS = [
  'job_viewed',
  'job_apply_clicked',
  'job_self_declared',
  'job_interceptor_shown',
  'job_status_changed',
  'job_filter_applied',
  'job_posted',
  'rejection_email_sent',
] as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number]

const DISTINCT_ID_KEY = 'jid_analytics_distinct_id'

function getDistinctId(): string {
  if (typeof window === 'undefined') return 'server'
  const existing = localStorage.getItem(DISTINCT_ID_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DISTINCT_ID_KEY, id)
  return id
}

export function setAnalyticsUserId(userId: string | null) {
  if (typeof window === 'undefined' || !userId) return
  localStorage.setItem(DISTINCT_ID_KEY, userId)
}

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', event, properties)
    }
    return
  }

  void fetch(`${host}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      event,
      distinct_id: getDistinctId(),
      properties: {
        ...properties,
        $lib: 'jid-web',
      },
    }),
    keepalive: true,
  }).catch(() => {
    /* best-effort */
  })
}
