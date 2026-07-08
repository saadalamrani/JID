import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { ReinstateProfileButton } from '@/components/profile/reinstate-profile-button'
import type { ProfileRecord } from '@/lib/profile/types'

type ProfileSuspendedStateProps = {
  profile: ProfileRecord
  showReinstate?: boolean
}

/**
 * Staff/admin suspended-profile shell (Section 6.3 / 12 Step 15).
 * Distinct from ProfileEmptyState — metadata only, no public content.
 */
export async function ProfileSuspendedState({
  profile,
  showReinstate = true,
}: ProfileSuspendedStateProps) {
  const t = await getTranslations('profile.public')

  return (
    <div className="rounded-xl border border-amber-300 bg-gradient-to-b from-amber-50 to-amber-50/40 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <ShieldAlert className="h-6 w-6 text-amber-700" aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{t('suspendedAdminTitle')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('suspendedAdminMessage')}</p>
          </div>
        </div>
        {showReinstate ? <ReinstateProfileButton profileId={profile.id} /> : null}
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-amber-200/80 bg-card/70 p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('suspendedProfileId')}
          </dt>
          <dd className="mt-1 font-mono text-sm text-foreground">{profile.id}</dd>
        </div>
        {profile.full_name ? (
          <div className="rounded-lg border border-amber-200/80 bg-card/70 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('suspendedProfileName')}
            </dt>
            <dd className="mt-1 text-sm text-foreground">{profile.full_name}</dd>
          </div>
        ) : null}
        {profile.suspended_at ? (
          <div className="rounded-lg border border-amber-200/80 bg-card/70 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('suspendedSince')}
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {new Date(profile.suspended_at).toLocaleString('ar-SA')}
            </dd>
          </div>
        ) : null}
        {profile.suspended_reason ? (
          <div className="rounded-lg border border-amber-200/80 bg-card/70 p-4 sm:col-span-2">
            <dt className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              {t('suspendedReason')}
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-foreground">{profile.suspended_reason}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
