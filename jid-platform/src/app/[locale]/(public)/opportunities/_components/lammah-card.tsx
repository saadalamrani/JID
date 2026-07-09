'use client'

import { Briefcase, ExternalLink, MapPin } from 'lucide-react'
import { useLocale } from 'next-intl'
import { CompanyLogo } from '@/app/[locale]/(public)/catalog/_components/company-logo'
import { OwnershipBadge } from '@/app/[locale]/(public)/catalog/_components/ownership-badge'
import { TierBadge } from '@/components/monetization/tier-badge'
import { LAMMAH_EXTERNAL_SOURCE_NOTE_AR } from '@/lib/lammah/constants'
import { lammahDaysUntilExpiry } from '@/lib/lammah/mappers'
import { cn } from '@/lib/utils'
import { useCatalogRegions, useCatalogSectors } from '@/hooks/use-catalog-metadata'
import { EXPERIENCE_LEVEL_LABELS } from '@/types/job'
import type { LammahOpportunityCard } from '@/types/lammah'
import { Pill } from './pill'

type LammahCardProps = {
  item: LammahOpportunityCard
  className?: string
}

export function LammahCard({ item, className }: LammahCardProps) {
  const locale = useLocale() as 'ar' | 'en'
  const { data: sectors = [] } = useCatalogSectors()
  const { data: regions = [] } = useCatalogRegions()

  const title =
    locale === 'ar'
      ? item.titleAr || item.titleEn || '—'
      : item.titleEn || item.titleAr || '—'
  const sector = sectors.find((s) => s.slug === item.sector)
  const region = regions.find((r) => r.slug === item.region)
  const sectorLabel =
    locale === 'ar' ? sector?.name_ar ?? sector?.name_en : sector?.name_en ?? sector?.name_ar
  const regionLabel =
    locale === 'ar' ? region?.name_ar ?? region?.name_en : region?.name_en ?? region?.name_ar
  const daysLeft = lammahDaysUntilExpiry(item.expiresAt)

  return (
    <article
      role="listitem"
      className={cn(
        'relative flex min-h-[300px] flex-col rounded-xl border border-jid-gold/25 bg-card p-4 shadow-sm',
        className,
      )}
    >
      <a
        href={item.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'absolute inset-0 z-10 rounded-xl',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        )}
        aria-label={`فتح ${title} على المصدر الخارجي`}
      />

      <header className="relative z-20 flex items-start gap-3 pointer-events-none">
        <CompanyLogo name={item.companyNameRaw} logoUrl={item.companyLogoUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-arabic text-sm font-medium text-muted-foreground">
            {item.companyNameRaw}
          </p>
          <h2 className="mt-0.5 line-clamp-2 font-arabic text-base font-semibold text-foreground">
            {title}
          </h2>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <TierBadge tier="plus" />
          {item.ownershipType ? <OwnershipBadge type={item.ownershipType} /> : null}
        </div>
      </header>

      <div className="relative z-20 mt-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
        {item.experienceLevel ? (
          <Pill icon={Briefcase}>{EXPERIENCE_LEVEL_LABELS[item.experienceLevel]}</Pill>
        ) : null}
        {regionLabel ? <Pill icon={MapPin}>{regionLabel}</Pill> : null}
        {sectorLabel ? <Pill>{sectorLabel}</Pill> : null}
      </div>

      {item.excerpt ? (
        <p className="relative z-20 mt-3 line-clamp-2 font-arabic text-sm text-muted-foreground pointer-events-none">
          {item.excerpt}
        </p>
      ) : null}

      <div className="relative z-20 mt-auto space-y-2 pt-4 pointer-events-none">
        <p
          className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-2 font-arabic text-xs leading-relaxed text-muted-foreground"
          aria-label="تنبيه المصدر الخارجي"
        >
          {LAMMAH_EXTERNAL_SOURCE_NOTE_AR}
        </p>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-arabic">
            {daysLeft <= 1 ? 'تنتهي اليوم' : `متبقٍ ${daysLeft} يوم`}
          </span>
          <span className="inline-flex items-center gap-1 font-arabic">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {item.sourceName}
          </span>
        </div>
      </div>
    </article>
  )
}
