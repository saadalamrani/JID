'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'
import { packagesForActor, type CommercialActor, type CommercialPackage } from '@/lib/commercial/contracts'
import { cn } from '@/lib/utils'

function kindLabel(kind: CommercialPackage['kind'], t: ReturnType<typeof useTranslations>): string {
  return t(`kinds.${kind}`)
}

type PackageCatalogProps = {
  actor: CommercialActor
  currentPlanKey?: string | null
  className?: string
}

export function PackageCatalog({ actor, currentPlanKey, className }: PackageCatalogProps) {
  const t = useTranslations('commercial.catalog')
  const locale = useLocale()
  const isAr = locale.startsWith('ar')
  const packages = packagesForActor(actor)

  return (
    <div className={cn('space-y-4', className)} data-testid={`package-catalog-${actor}`}>
      <p className="font-arabic text-sm leading-relaxed text-muted-foreground">{t('priceNotAdopted')}</p>
      <p className="font-arabic text-xs leading-relaxed text-muted-foreground">{t('prohibitedNote')}</p>
      <ul className="grid gap-4 md:grid-cols-2">
        {packages.map((item) => {
          const current = Boolean(currentPlanKey && item.operationalPlanKey === currentPlanKey)
          const name = isAr ? item.nameAr : item.nameEn
          const summary = isAr ? item.summaryAr : item.summaryEn
          const includes = isAr ? item.includesAr : item.includesEn
          return (
            <li
              key={item.key}
              className={cn(
                'flex h-full flex-col rounded-2xl border bg-card p-5',
                current ? 'border-accent/50' : 'border-border',
              )}
              data-testid={`package-card-${item.key}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-arabic text-base font-semibold text-foreground">{name}</h3>
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 font-arabic text-xs text-muted-foreground">
                  {kindLabel(item.kind, t)}
                </span>
                {current ? (
                  <span className="inline-flex rounded-full bg-accent/20 px-2 py-0.5 font-arabic text-xs font-semibold text-primary">
                    {t('current')}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 font-arabic text-sm leading-relaxed text-muted-foreground">{summary}</p>
              <p className="mt-3 font-arabic text-sm font-semibold text-foreground">{t('priceLabel')}</p>
              <ul className="mt-3 space-y-1.5 font-arabic text-sm text-muted-foreground">
                {includes.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
      <div className="rounded-xl border border-border bg-muted/20 p-5">
        <h2 className="font-arabic text-base font-semibold text-foreground">{t('salesTitle')}</h2>
        <p className="mt-2 font-arabic text-sm text-muted-foreground">{t('salesBody')}</p>
        <Button asChild className="mt-4 bg-primary font-arabic text-primary-foreground hover:bg-primary/90">
          <Link href="/contact">{t('salesCta')}</Link>
        </Button>
      </div>
    </div>
  )
}
