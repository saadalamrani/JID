'use client'

import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { focusRingClass, touchTargetClass } from '@/lib/ui/a11y'
import { cn } from '@/lib/utils'
import { Link } from '@/lib/i18n/navigation'
import { isValidLocale } from '@/lib/i18n/config'
import { getCareerRecordCopy } from '@/features/career-record/copy'
import { getCvProjectionCopy } from '@/features/cv-projection/copy'

type CareerRecordEntryLinksProps = {
  className?: string
}

export function CareerRecordEntryLinks({ className }: CareerRecordEntryLinksProps) {
  const localeValue = useLocale()
  const locale = isValidLocale(localeValue) ? localeValue : 'ar'
  const recordCopy = getCareerRecordCopy(locale)
  const cvCopy = getCvProjectionCopy(locale)

  return (
    <section className={cn('border-b border-border pb-6', className)} aria-label={recordCopy.title}>
      <PageHeader title={recordCopy.title} description={recordCopy.description} />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button asChild size="lg" className={cn(touchTargetClass, focusRingClass)}>
          <Link href="/profile/career-record">{recordCopy.title}</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className={cn(touchTargetClass, focusRingClass)}
        >
          <Link href="/profile/cv-projection">{cvCopy.title}</Link>
        </Button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{recordCopy.legacyCvCompatibility}</p>
    </section>
  )
}
