'use client'

import { Building2, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

type EmptyUniversityStateProps = {
  title?: string
  description?: string
  ctaHref?: string
  ctaLabel?: string
}

/** Spec 05-B DEF-04/05/06 — honest empty dashboard; CTA targets university owner edit. */
export function EmptyUniversityState({
  title,
  description,
  ctaHref = '/university/profile/edit',
  ctaLabel,
}: EmptyUniversityStateProps) {
  const t = useTranslations('university.dashboard.empty')

  return (
    <section
      className="rounded-2xl border border-dashed border-accent/60 bg-background/60 p-8 text-center"
      data-testid="university-dashboard-empty"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-sm">
        <Building2 className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title ?? t('title')}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-foreground/70">
        {description ?? t('description')}
      </p>

      <Link
        href={ctaHref}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Sparkles className="h-4 w-4" />
        {ctaLabel ?? t('cta')}
      </Link>
    </section>
  )
}
