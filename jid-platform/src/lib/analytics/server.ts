import 'server-only'

import type { AnalyticsEvent } from '@/lib/analytics/track'

/** Server-side analytics (Section 14) — best-effort PostHog capture. */
export async function trackServer(
  event: AnalyticsEvent,
  distinctId: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'
  if (!apiKey) return

  try {
    await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $lib: 'jid-server' },
      }),
    })
  } catch {
    /* best-effort */
  }
}
