'use client'

import { useLocale, useTranslations } from 'next-intl'
import { ABHATHLI_DISMISS_REASON_LABELS, ABHATHLI_MATCH_TAG_AR } from '@/lib/abhathli/constants'
import type { AbhathliDismissReason } from '@/lib/abhathli/constants'
import { CompanyLogo } from '@/app/[locale]/(public)/catalog/_components/company-logo'
import { TierBadge } from '@/components/monetization/tier-badge'
import { LAMMAH_EXTERNAL_SOURCE_NOTE_AR } from '@/lib/lammah/constants'
import { Link as LocaleLink } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils'
import type { MandateMatchCard } from '@/types/abhathli'
import { JobActionButton } from './job-action-button'
import { Pill } from './pill'

const REASON_LABELS: Record<string, string> = {
  sector: 'قطاع',
  region: 'منطقة',
  keyword: 'كلمة مفتاحية',
  experience: 'خبرة',
  ownership: 'ملكية',
}

type MatchCardProps = {
  match: MandateMatchCard
  onDismiss: (matchId: string, reason: AbhathliDismissReason) => void
  dismissing?: boolean
  className?: string
}

export function MatchCard({ match, onDismiss, dismissing = false, className }: MatchCardProps) {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('opportunities.abhathli.match')

  const title =
    locale === 'ar'
      ? match.titleAr || match.titleEn || '—'
      : match.titleEn || match.titleAr || '—'

  const isLammah = Boolean(match.lammahId)

  return (
    <article
      className={cn(
        'flex w-[280px] shrink-0 flex-col rounded-xl border border-border/60 bg-card p-3 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-accent/20 px-2 py-0.5 font-arabic text-[10px] font-semibold text-primary">
          {ABHATHLI_MATCH_TAG_AR}
        </span>
        <TierBadge tier={match.tier} />
      </div>

      <header className="mt-2 flex items-start gap-2">
        <CompanyLogo name={match.companyName ?? '—'} logoUrl={match.companyLogoUrl} />
        <div className="min-w-0">
          <p className="truncate font-arabic text-xs text-muted-foreground">{match.companyName}</p>
          <h3 className="line-clamp-2 font-arabic text-sm font-semibold text-foreground">{title}</h3>
        </div>
      </header>

      <div className="mt-2 flex flex-wrap gap-1">
        {match.matchReasons.map((reason) => (
          <Pill key={reason} className="text-[10px]">
            {REASON_LABELS[reason] ?? reason}
          </Pill>
        ))}
      </div>

      {isLammah ? (
        <p className="mt-2 rounded border border-border/50 bg-muted/40 px-2 py-1 font-arabic text-[10px] text-muted-foreground">
          {LAMMAH_EXTERNAL_SOURCE_NOTE_AR}
        </p>
      ) : null}

      <div className="relative z-20 mt-3 space-y-2">
        {match.jobId ? (
          <JobActionButton
            jobId={match.jobId}
            jobTitle={title}
            companyName={match.companyName ?? '—'}
            applyUrl={null}
            className="pointer-events-auto relative z-30"
          />
        ) : match.externalUrl ? (
          <a
            href={match.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 font-arabic text-sm font-medium text-primary-foreground"
            onClick={() => {
              if (process.env.NODE_ENV === 'development') {
                console.debug('[analytics]', 'abhathli_match_opened', { match_id: match.id })
              }
            }}
          >
            {t('openExternal')}
          </a>
        ) : null}

        {match.jobSlug ? (
          <LocaleLink
            href={`/opportunities/${match.jobSlug}`}
            className="block text-center font-arabic text-xs text-primary hover:underline"
            onClick={() => {
              if (process.env.NODE_ENV === 'development') {
                console.debug('[analytics]', 'abhathli_match_opened', { match_id: match.id })
              }
            }}
          >
            {t('viewDetails')}
          </LocaleLink>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1 border-t border-border/40 pt-2">
        {(Object.keys(ABHATHLI_DISMISS_REASON_LABELS) as AbhathliDismissReason[]).map((reason) => (
          <button
            key={reason}
            type="button"
            disabled={dismissing}
            onClick={() => {
              if (process.env.NODE_ENV === 'development') {
                console.debug('[analytics]', 'abhathli_match_dismissed', {
                  match_id: match.id,
                  reason,
                })
              }
              onDismiss(match.id, reason)
            }}
            className="rounded-full border border-border px-2 py-0.5 font-arabic text-[10px] text-muted-foreground hover:bg-muted"
          >
            {ABHATHLI_DISMISS_REASON_LABELS[reason]}
          </button>
        ))}
      </div>
    </article>
  )
}
