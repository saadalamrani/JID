'use client'

import { useTranslations } from 'next-intl'
import { Flag } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type OpenFlagsWidgetProps = {
  count: number
}

/** Section 6.1 — read-only open content flags count. */
export function OpenFlagsWidget({ count }: OpenFlagsWidgetProps) {
  const t = useTranslations('staff.dashboard.openFlags')

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </div>
        <Flag className="h-5 w-5 text-primary/70" aria-hidden />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums text-foreground">{count.toLocaleString()}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('hint')}</p>
      </CardContent>
    </Card>
  )
}
