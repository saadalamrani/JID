'use client'

import { useTranslations } from 'next-intl'
import { LAMMAH_EXTERNAL_SOURCE_NOTE_AR } from '@/lib/lammah/constants'
import { useLammahWeeklyCount } from '@/lib/hooks/use-lammah-feed-query'
import { cn } from '@/lib/utils'
import { LammahCard } from './lammah-card'
import type { LammahOpportunityCard } from '@/types/lammah'

const PLACEHOLDER_ITEMS: LammahOpportunityCard[] = [
  {
    id: 'preview-1',
    sourceId: 'preview',
    sourceName: 'مصدر خارجي',
    companyId: null,
    companyNameRaw: 'شركة نموذجية',
    titleAr: 'محلل بيانات — فرصة مرصودة',
    titleEn: null,
    excerpt: 'معاينة لمحتوى لمّاح الحصري لمشتركي بلس.',
    sector: 'technology-information',
    region: 'riyadh',
    ownershipType: null,
    experienceLevel: 'mid',
    externalUrl: '#',
    sourcePublishedAt: new Date().toISOString(),
    scrapedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    extractionConfidence: 0.9,
    companyLogoUrl: null,
  },
]

type LammahTeaserProps = {
  variant?: 'inline' | 'preview'
  className?: string
}

export function LammahTeaser({ variant = 'inline', className }: LammahTeaserProps) {
  const t = useTranslations('opportunities.lammah')
  const { data: weeklyCount = 0 } = useLammahWeeklyCount()

  if (variant === 'preview') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {PLACEHOLDER_ITEMS.map((item) => (
          <LammahCard key={item.id} item={item} />
        ))}
      </div>
    )
  }

  return (
    <section
      className={cn(
        'rounded-xl border border-jid-gold/30 bg-jid-beige-warm/50 p-4',
        className,
      )}
      aria-label={t('teaserAria')}
    >
      <p className="font-arabic text-sm font-medium text-jid-olive">{t('teaserHeadline')}</p>
      <p className="mt-1 font-arabic text-sm text-muted-foreground">
        {t('teaserWeekly', { count: weeklyCount })}
      </p>
      <p className="mt-3 rounded-md border border-border/60 bg-card/70 px-2.5 py-2 font-arabic text-xs text-muted-foreground">
        {LAMMAH_EXTERNAL_SOURCE_NOTE_AR}
      </p>
    </section>
  )
}
