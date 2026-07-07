import { AnnouncementCarousel } from '@/app/[locale]/(public)/pulse/_components/announcement-carousel'
import { AnnouncementEmptyState } from '@/app/[locale]/(public)/pulse/_components/announcement-empty-state'
import { fetchActiveAnnouncements } from '@/lib/pulse/queries'

/** Section 12 Step 7 — announcements billboard (server fetch + client carousel). */
export async function AnnouncementsBillboard() {
  const announcements = await fetchActiveAnnouncements()

  if (announcements.length === 0) {
    return <AnnouncementEmptyState />
  }

  return <AnnouncementCarousel announcements={announcements} />
}
