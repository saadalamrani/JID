'use client'

import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { IndividualProfileProjection } from '@/lib/profile/individual-projection-types'

const ABOUT_MAX = 500

type ProfileOverviewSectionProps = {
  projection: IndividualProfileProjection
}

export function ProfileOverviewSection({ projection }: ProfileOverviewSectionProps) {
  const t = useTranslations('profile.workspace.overview')
  const isOwner = projection.viewState === 'owner'

  if (!projection.sections.showOverview) return null

  const hasContent = Boolean(projection.overview?.trim())

  if (!hasContent && !isOwner) return null

  return (
    <section id="profile-section-overview" className="scroll-mt-24">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        {isOwner ? (
          <Link
            href="/profile/edit?focus=about"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Pencil className="h-3 w-3" aria-hidden />
            {t('edit')}
          </Link>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        {hasContent ? (
          <>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {projection.overview}
            </p>
            {isOwner ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {t('charCount', { count: projection.overview?.length ?? 0, max: ABOUT_MAX })}
              </p>
            ) : null}
          </>
        ) : (
          <Link
            href="/profile/edit?focus=about"
            className="text-sm text-primary hover:underline"
          >
            {t('emptyPrompt')}
          </Link>
        )}
      </div>
    </section>
  )
}
