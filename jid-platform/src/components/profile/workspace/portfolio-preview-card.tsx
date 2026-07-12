'use client'

import { ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { PortfolioPreview } from '@/lib/profile/individual-projection-types'

type PortfolioPreviewCardProps = {
  portfolio: PortfolioPreview
  isOwner: boolean
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function PortfolioPreviewCard({ portfolio, isOwner }: PortfolioPreviewCardProps) {
  const t = useTranslations('profile.workspace.portfolio')

  if (!portfolio.url && !portfolio.previewText) {
    if (!isOwner) return null
    return (
      <section id="profile-section-portfolio" className="scroll-mt-24">
        <h2 className="mb-3 text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {t('emptyOwner')}
        </p>
      </section>
    )
  }

  return (
    <section id="profile-section-portfolio" className="scroll-mt-24">
      <h2 className="mb-3 text-lg font-semibold text-foreground">{t('title')}</h2>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        {portfolio.previewText ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {portfolio.previewText}
          </p>
        ) : null}
        {portfolio.url ? (
          <a
            href={normalizeUrl(portfolio.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {isOwner ? t('openFull') : t('openFullPublic')}
          </a>
        ) : null}
      </div>
    </section>
  )
}
