import 'server-only'

import { trackServer } from '@/lib/analytics/server'

export type LegalPageSlug = 'privacy' | 'terms' | 'pdpl'

/** Section 20 — server-side legal page view (keeps pages free of client JS). */
export async function trackLegalPageViewed(page: LegalPageSlug): Promise<void> {
  await trackServer('legal_page_viewed', 'anonymous', { page })
}
