import { getTranslations } from 'next-intl/server'
import { IndividualProfileView } from '@/components/profile/individual-profile-view'
import { ProfileBadgesAsync } from '@/components/profile/profile-badges-async'
import { ProfileSuspendedState } from '@/components/profile/profile-suspended-state'
import type { ProfilePageContext } from '@/lib/profile/queries'
import type { ProfileRecord } from '@/lib/profile/types'

type SuspendedAdminViewProps = {
  context: ProfilePageContext
  profile: ProfileRecord
}

/**
 * Section 6.3 — staff/super_admin suspended profile: metadata + full profile preview.
 */
export async function SuspendedAdminView({ context, profile }: SuspendedAdminViewProps) {
  const t = await getTranslations('profile.public')

  return (
    <div className="container-jid space-y-6 py-8">
      <ProfileSuspendedState profile={profile} />
      <p className="text-sm text-jid-ink/60">{t('staffPreviewHint')}</p>
      <IndividualProfileView
        context={context}
        badges={[]}
        isOwner={false}
        isHrViewer={false}
        isMentorViewer={false}
        badgeSlot={<ProfileBadgesAsync userId={profile.id} />}
      />
    </div>
  )
}
