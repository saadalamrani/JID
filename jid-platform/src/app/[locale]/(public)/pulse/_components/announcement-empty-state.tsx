import { Megaphone } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

/** Section 6.11 — zero published announcements. */
export async function AnnouncementEmptyState() {
  const t = await getTranslations('pulse.announcements.empty')

  return (
    <section
      className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/40 p-8 text-center"
      aria-label={t('ariaLabel')}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background">
        <Megaphone className="h-7 w-7 text-primary/70" aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{t('title')}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t('description')}</p>
    </section>
  )
}
