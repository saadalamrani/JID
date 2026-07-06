'use client'

import { FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'

/** Section 7.2 — profile entry CTA for CV builder. */
export function CvBuilderCtaCard() {
  const t = useTranslations('cv.cta')

  return (
    <section
      className="rounded-xl border border-jid-line bg-white p-5 shadow-sm"
      aria-label={t('ariaLabel')}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-jid-olive/10">
            <FileText className="h-5 w-5 text-jid-olive" aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-jid-ink">{t('title')}</h2>
            <p className="mt-1 text-sm text-jid-ink/60">{t('description')}</p>
          </div>
        </div>
        <Button asChild className="shrink-0 bg-jid-olive hover:bg-jid-olive/90">
          <Link href="/profile/cv">{t('action')}</Link>
        </Button>
      </div>
    </section>
  )
}
