import { AlertTriangle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

type MentorPendingStaffBannerProps = {
  status: string
}

/** Staff-only notice when viewing a non-approved mentor profile. */
export async function MentorPendingStaffBanner({ status }: MentorPendingStaffBannerProps) {
  const t = await getTranslations('profile.mentor.public')

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <div>
          <p className="text-sm font-medium text-jid-ink">{t('staffPendingTitle')}</p>
          <p className="mt-1 text-sm text-jid-ink/70">
            {t('staffPendingMessage', { status })}
          </p>
        </div>
      </div>
    </div>
  )
}
