import { AnnouncementForm } from '../_components/announcement-form'

export default function NewAdminAnnouncementPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">New Announcement</h1>
        <p className="mt-1 text-sm text-foreground/70">Category → Content → Schedule</p>
      </header>
      <AnnouncementForm mode="create" />
    </div>
  )
}
