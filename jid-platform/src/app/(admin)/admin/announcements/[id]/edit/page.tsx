import { notFound } from 'next/navigation'
import { AnnouncementForm } from '../../_components/announcement-form'
import { fetchAnnouncementById } from '@/lib/announcements/queries'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditAdminAnnouncementPage({ params }: PageProps) {
  const { id } = await params
  const announcement = await fetchAnnouncementById(id)
  if (!announcement) notFound()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Edit Announcement</h1>
        <p className="mt-1 text-sm text-foreground/70">Update content and schedule.</p>
      </header>
      <AnnouncementForm
        mode="edit"
        announcementId={announcement.id}
        initialValues={{
          title_ar: announcement.title_ar,
          body_ar: announcement.body_ar ?? '',
          category: announcement.category,
          starts_at: announcement.starts_at,
          expires_at: announcement.expires_at,
          cta_url: announcement.cta_url ?? '',
          cta_label_ar: announcement.cta_label_ar ?? '',
          is_featured: announcement.is_featured,
          is_published: announcement.is_published,
        }}
      />
    </div>
  )
}
