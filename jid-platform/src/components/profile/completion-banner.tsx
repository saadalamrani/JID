'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { ProfileCompletionBar } from '@/components/profile/profile-completion-bar'
import { cn } from '@/lib/utils'

type CompletionBannerProps = {
  percent: number
  className?: string
}

export function CompletionBanner({ percent, className }: CompletionBannerProps) {
  const t = useTranslations('profile.public')

  return (
    <div
      className={cn(
        'rounded-xl border border-jid-gold/40 bg-jid-gold/10 p-4',
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-jid-olive">{t('completionBannerTitle')}</p>
          <p className="text-xs text-jid-ink/60">{t('completionBannerHint')}</p>
        </div>
        <Link
          href="/profile/edit"
          className="shrink-0 text-sm font-medium text-jid-olive underline-offset-4 hover:underline"
        >
          {t('completionBannerCta')}
        </Link>
      </div>
      <ProfileCompletionBar percent={percent} className="mt-3" />
    </div>
  )
}
