'use client'

import { Briefcase, CalendarDays, ExternalLink, MapPin, RefreshCw } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { CompanyLogo } from '@/app/[locale]/(public)/catalog/_components/company-logo'
import { OwnershipBadge } from '@/app/[locale]/(public)/catalog/_components/ownership-badge'
import { TierBadge } from '@/components/monetization/tier-badge'
import { cn } from '@/lib/utils'
import type { LammahOpportunityCard } from '@/types/lammah'
import { LammahReportButton } from './lammah-report-button'
import { Pill } from './pill'

type LammahCardProps = {
  item: LammahOpportunityCard
  className?: string
}

function formatDate(value: string, locale: 'ar' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-SA-u-nu-latn', {
    dateStyle: 'medium',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(value))
}

export function LammahCard({ item, className }: LammahCardProps) {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('opportunities.lammah')
  const tFilters = useTranslations('filters')
  const title = locale === 'ar' ? item.titleAr || item.titleEn : item.titleEn || item.titleAr
  const locationLabel = [item.locationCity,item.region,item.locationCountry]
    .filter((value,index,values):value is string=>Boolean(value)&&values.indexOf(value)===index)
    .join(locale==='ar' ? '، ' : ', ')

  return (
    <article
      role="listitem"
      className={cn(
        'flex min-h-[330px] flex-col rounded-xl border border-accent/25 bg-card p-4 shadow-sm',
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border border-accent/35 bg-accent/15 px-2.5 py-1 font-arabic text-xs font-semibold text-primary">
          {t('externalOpportunity')}
        </span>
        <TierBadge tier="plus" />
      </div>

      <header className="flex items-start gap-3">
        <CompanyLogo name={item.companyNameRaw} logoUrl={item.companyLogoUrl} />
        <div className="min-w-0 flex-1">
          <p className="font-arabic text-sm font-medium text-muted-foreground">
            {item.companyNameRaw}
          </p>
          <h2 className="mt-0.5 line-clamp-2 font-arabic text-base font-semibold text-foreground">
            {title}
          </h2>
        </div>
        {item.ownershipType ? <OwnershipBadge type={item.ownershipType} /> : null}
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Pill>{t(`opportunityTypes.${item.opportunityType}`)}</Pill>
        {item.experienceLevel ? (
          <Pill icon={Briefcase}>{tFilters(`experienceLevel.${item.experienceLevel}`)}</Pill>
        ) : null}
        {locationLabel ? <Pill icon={MapPin}>{locationLabel}</Pill> : null}
        {item.sector ? <Pill>{item.sector}</Pill> : null}
      </div>

      {item.excerpt ? (
        <p className="mt-3 line-clamp-2 font-arabic text-sm text-muted-foreground">
          {item.excerpt}
        </p>
      ) : null}

      <dl className="mt-3 space-y-1.5 font-arabic text-xs text-muted-foreground">
        {item.expiresAt ? (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            <dt>{t('deadlineLabel')}</dt>
            <dd>{formatDate(item.expiresAt, locale)}</dd>
          </div>
        ) : null}
        <div className="flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          <dt>{t('lastConfirmedLabel')}</dt>
          <dd>{formatDate(item.lastConfirmedAt, locale)}</dd>
        </div>
      </dl>

      <div className="mt-auto space-y-3 pt-4">
        <p className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-2 font-arabic text-xs leading-relaxed text-muted-foreground">
          {t('externalApplicationNotice')}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 font-arabic text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {t('officialApply')}
          </a>
          <span className="font-arabic text-xs text-muted-foreground">
            {t('sourceLabel')}: {item.sourceName}
          </span>
        </div>
        <LammahReportButton opportunityId={item.id} />
      </div>
    </article>
  )
}
