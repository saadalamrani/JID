import { AnnouncementsListClient } from '@/app/[locale]/(staff)/staff/announcements/_components/announcements-list-client'
import { fetchStaffAnnouncements } from '@/lib/announcements/queries'
import type { AnnouncementCategory } from '@/lib/validations/announcement'
import { ANNOUNCEMENT_CATEGORIES } from '@/lib/validations/announcement'

type PageProps = {
  searchParams: Promise<{
    category?: string
    status?: string
    search?: string
  }>
}

/**
 * Section 12 Step 3 — staff announcements list (canonical /staff path; guarded by staff-portal middleware).
 */
export default async function StaffAnnouncementsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const categoryParam = params.category ?? 'all'
  const statusParam = params.status ?? 'all'

  const category =
    categoryParam !== 'all' && (ANNOUNCEMENT_CATEGORIES as readonly string[]).includes(categoryParam)
      ? (categoryParam as AnnouncementCategory)
      : 'all'

  const status =
    statusParam === 'published' ||
    statusParam === 'draft' ||
    statusParam === 'scheduled' ||
    statusParam === 'expired'
      ? statusParam
      : 'all'

  const announcements = await fetchStaffAnnouncements({
    category,
    status,
    search: params.search,
  })

  return (
    <AnnouncementsListClient
      announcements={announcements}
      initialCategory={categoryParam}
      initialStatus={statusParam}
      initialSearch={params.search ?? ''}
    />
  )
}
