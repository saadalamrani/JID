import Link from 'next/link'
import { AnnouncementList } from './_components/announcement-list'
import { fetchStaffAnnouncements } from '@/lib/announcements/queries'

export default async function AdminAnnouncementsPage() {
  const announcements = await fetchStaffAnnouncements({ status: 'all' })

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Announcements</h1>
          <p className="text-sm text-foreground/70">Ordered by created date (newest first).</p>
        </div>
        <Link href="/admin/announcements/new" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
          New Announcement
        </Link>
      </header>

      <AnnouncementList announcements={announcements} />
    </div>
  )
}
