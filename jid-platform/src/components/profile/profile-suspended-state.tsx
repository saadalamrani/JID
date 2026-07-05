import { AlertTriangle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { ProfileRecord } from '@/lib/profile/types'

type ProfileSuspendedStateProps = {
  profile: ProfileRecord
}

/** Admin-only suspended profile shell (Section 6.3 / 13). */
export async function ProfileSuspendedState({ profile }: ProfileSuspendedStateProps) {
  const t = await getTranslations('profile.public')

  return (
    <div className="container-jid py-10">
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" aria-hidden />
          <div>
            <h1 className="text-lg font-semibold text-jid-ink">{t('suspendedAdminTitle')}</h1>
            <p className="mt-2 text-sm text-jid-ink/70">{t('suspendedAdminMessage')}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-jid-ink/50">{t('suspendedProfileId')}</dt>
                <dd className="font-mono text-jid-ink">{profile.id}</dd>
              </div>
              {profile.full_name ? (
                <div>
                  <dt className="text-jid-ink/50">{t('suspendedProfileName')}</dt>
                  <dd className="text-jid-ink">{profile.full_name}</dd>
                </div>
              ) : null}
              {profile.suspended_at ? (
                <div>
                  <dt className="text-jid-ink/50">{t('suspendedSince')}</dt>
                  <dd className="text-jid-ink">
                    {new Date(profile.suspended_at).toLocaleString('ar-SA')}
                  </dd>
                </div>
              ) : null}
              {profile.suspended_reason ? (
                <div>
                  <dt className="text-jid-ink/50">{t('suspendedReason')}</dt>
                  <dd className="text-jid-ink">{profile.suspended_reason}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
