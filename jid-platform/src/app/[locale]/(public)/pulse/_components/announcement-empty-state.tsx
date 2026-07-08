import { Megaphone } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { EmptyState } from '@/components/shared/empty-state'

/** Section 6.11 — zero published announcements. */
export async function AnnouncementEmptyState() {
  const t = await getTranslations('pulse.announcements.empty')

  return (
    <section aria-label={t('ariaLabel')}>
      <EmptyState
        icon={Megaphone}
        variant="inline"
        title={t('title')}
        description={t('description')}
        className="min-h-[280px]"
      />
    </section>
  )
}
