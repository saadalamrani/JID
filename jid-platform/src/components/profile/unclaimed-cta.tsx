'use client'

import { Building2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'

type UnclaimedCTAProps = {
  companyId: string
}

/** Section 6.9 — claim prompt for unclaimed company entities. */
export function UnclaimedCTA({ companyId }: UnclaimedCTAProps) {
  const t = useTranslations('profile.company.public')

  return (
    <section className="rounded-xl border border-border bg-accent/10 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Building2 className="h-8 w-8 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 className="text-base font-semibold text-foreground">{t('unclaimedTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('unclaimedMessage')}</p>
          </div>
        </div>
        <Button asChild className="shrink-0 bg-primary hover:bg-primary/90">
          <Link href={`/companies/${companyId}/claim`}>{t('unclaimedCta')}</Link>
        </Button>
      </div>
    </section>
  )
}
