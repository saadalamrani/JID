'use client'

import { Eye } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

type PublicPreviewBannerProps = {
  profileId: string
}

export function PublicPreviewBanner({ profileId }: PublicPreviewBannerProps) {
  const t = useTranslations('profile.workspace')

  return (
    <div className="border-b border-border bg-primary/5">
      <div className="container-jid flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
        <span className="inline-flex items-center gap-2 text-foreground">
          <Eye className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          {t('publicPreviewBanner')}
        </span>
        <Link
          href={`/profile/${profileId}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('publicPreviewExit')}
        </Link>
      </div>
    </div>
  )
}
