/**
 * Fire-and-forget profile view tracking (Section 12 Step 14 / Section 13).
 *
 * Never await this function before rendering — schedule via ProfileViewTracker
 * client mount or void-call from handlers only.
 */

export type TrackProfileViewInput = {
  profileId: string
  companyId: string
  source?: string
}

/**
 * Records a company-level profile view without blocking the caller.
 * Uses keepalive fetch when available (client) or void-scheduled API POST.
 */
export function trackProfileView(profileId: string, companyId: string, source?: string): void {
  void scheduleTrack({ profileId, companyId, source })
}

function scheduleTrack(input: TrackProfileViewInput): void {
  if (typeof window === 'undefined') {
    void postProfileView(input).catch(() => {})
    return
  }

  const body = JSON.stringify({
    profileId: input.profileId,
    companyId: input.companyId,
    source: input.source ?? 'profile_page',
  })

  const url = '/api/profile/views'

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' })
    const sent = navigator.sendBeacon(url, blob)
    if (sent) return
  }

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}

async function postProfileView(input: TrackProfileViewInput): Promise<void> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://127.0.0.1:3000'

  await fetch(`${base}/api/profile/views`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profileId: input.profileId,
      companyId: input.companyId,
      source: input.source ?? 'profile_page',
    }),
  })
}
