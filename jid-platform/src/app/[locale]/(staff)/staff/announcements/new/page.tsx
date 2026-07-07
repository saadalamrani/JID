import { getTranslations } from 'next-intl/server'
import { AnnouncementForm } from '@/app/[locale]/(staff)/staff/announcements/_components/announcement-form'

export default async function NewAnnouncementPage() {
  const t = await getTranslations('staff.announcements')

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-jid-ink">{t('newTitle')}</h1>
        <p className="mt-1 text-sm text-jid-ink/70">{t('newSubtitle')}</p>
      </header>
      <AnnouncementForm mode="create" />
    </div>
  )
}
