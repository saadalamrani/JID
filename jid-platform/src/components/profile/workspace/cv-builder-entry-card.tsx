'use client'

import { Download, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'

type CvBuilderEntryCardProps = {
  visible: boolean
}

export function CvBuilderEntryCard({ visible }: CvBuilderEntryCardProps) {
  const t = useTranslations('profile.workspace.cvBuilder')

  if (!visible) return null

  return (
    <section id="profile-section-cv" className="scroll-mt-24" aria-label={t('title')}>
      <h2 className="mb-3 text-lg font-semibold text-foreground">{t('title')}</h2>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">{t('hint')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href="/profile/cv">
              <FileText className="h-4 w-4" aria-hidden />
              {t('openBuilder')}
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="gap-2">
            <Link href="/profile/cv">
              <Download className="h-4 w-4" aria-hidden />
              {t('exportCv')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
