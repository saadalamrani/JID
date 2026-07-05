'use client'

import { Calendar, ExternalLink, Users } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { MentorActiveWorkshop } from '@/lib/profile/types'

type ActiveWorkshopCardProps = {
  workshop: MentorActiveWorkshop
}

export function ActiveWorkshopCard({ workshop }: ActiveWorkshopCardProps) {
  const t = useTranslations('profile.mentor.public')
  const locale = useLocale()
  const title =
    locale === 'ar' && workshop.title_ar ? workshop.title_ar : workshop.title

  return (
    <section className="rounded-xl border border-jid-gold/40 bg-jid-gold/10 p-5">
      <h2 className="mb-3 text-sm font-medium text-jid-olive">{t('workshopTitle')}</h2>
      <p className="text-base font-semibold text-jid-ink">{title}</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-jid-ink/70">
        {workshop.scheduled_at ? (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-4 w-4 text-jid-olive" aria-hidden />
            {new Date(workshop.scheduled_at).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        ) : null}
        {workshop.spots_remaining != null ? (
          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4 text-jid-olive" aria-hidden />
            {t('workshopSpots', { count: workshop.spots_remaining })}
          </span>
        ) : null}
      </div>

      {workshop.url ? (
        <Button asChild size="sm" variant="outline" className="mt-4 border-jid-line">
          <a href={workshop.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" aria-hidden />
            {t('workshopCta')}
          </a>
        </Button>
      ) : null}
    </section>
  )
}
