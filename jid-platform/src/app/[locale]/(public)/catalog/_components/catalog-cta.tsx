'use client'

import type { MouseEvent } from 'react'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Link as LocaleLink } from '@/lib/i18n/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type CatalogCtaProps = {
  slug: string | null
  careerPortalUrl: string | null
  linkStatus: string
  hasPublishedProfile: boolean
  className?: string
  onExternalClick?: (event: MouseEvent) => void
}

export function CatalogCta({
  slug,
  careerPortalUrl,
  linkStatus,
  hasPublishedProfile,
  className,
  onExternalClick,
}: CatalogCtaProps) {
  const t = useTranslations('catalogPage.cta')
  const isHealthy = linkStatus === 'healthy'
  const hasPortal = isHealthy && Boolean(careerPortalUrl)
  const profilePath = slug ? `/companies/${slug}/profile` : null

  if (hasPublishedProfile && profilePath) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <LocaleLink
          href={profilePath}
          className={cn(
            'inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5',
            'font-arabic text-sm font-medium',
            'bg-primary text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80',
          )}
          onClick={onExternalClick}
        >
          {t('jidProfile')}
        </LocaleLink>

        {hasPortal ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={careerPortalUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-border',
                    'text-primary transition-colors hover:bg-background',
                  )}
                  onClick={onExternalClick}
                  aria-label={t('officialPortalTooltip')}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </Link>
              </TooltipTrigger>
              <TooltipContent>{t('officialPortalTooltip')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
    )
  }

  if (hasPortal) {
    return (
      <Link
        href={careerPortalUrl!}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5',
          'font-arabic text-sm font-medium',
          'bg-primary text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80',
          className,
        )}
        onClick={onExternalClick}
      >
        {t('careerPortal')}
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
      </Link>
    )
  }

  return (
    <span
      role="button"
      tabIndex={-1}
      className={cn(
        'inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5',
        'font-arabic text-sm font-medium',
        'bg-border/30 text-muted-foreground',
        'pointer-events-none',
        className,
      )}
      aria-disabled="true"
      aria-label={t('linkPending')}
    >
      {t('linkPending')}
    </span>
  )
}
