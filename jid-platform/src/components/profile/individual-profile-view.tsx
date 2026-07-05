import type { ReactNode } from 'react'
import { IdentityHeader } from '@/components/profile/identity-header'
import { CompletionBanner } from '@/components/profile/completion-banner'
import { CompletionWizard } from '@/components/profile/completion-wizard'
import { HRActionStrip } from '@/components/profile/hr-action-strip'
import { OwnerActionsBar } from '@/components/profile/owner-actions-bar'
import { PublicContentSection } from '@/components/profile/public-content-section'
import { RequestMentorshipButton } from '@/components/profile/request-mentorship-button'
import { TrustSignals } from '@/components/profile/trust-signals'
import {
  resolveProfileDisplayState,
  toWizardInput,
} from '@/lib/profile/display-state'
import type { ProfilePageContext } from '@/lib/profile/queries'
import type { EarnedUserBadge } from '@/lib/profile/types'
import { calculateWizardCompletionPct } from '@/lib/profile/wizard-completion'

type IndividualProfileViewProps = {
  context: ProfilePageContext
  badges: EarnedUserBadge[]
  isOwner: boolean
  isHrViewer: boolean
  isMentorViewer: boolean
  badgeSlot?: React.ReactNode
}

export function IndividualProfileView({
  context,
  badges,
  isOwner,
  isHrViewer,
  isMentorViewer,
  badgeSlot,
}: IndividualProfileViewProps) {
  const { profile, universityName, city, skillCount } = context
  const displayState = resolveProfileDisplayState(profile, skillCount)
  const wizardInput = toWizardInput(profile, skillCount)
  const wizardPct = calculateWizardCompletionPct(wizardInput)
  const displayName = profile.full_name ?? '—'

  return (
    <main className="container-jid space-y-6 py-8">
      <IdentityHeader
        isOwner={isOwner}
        isVerified={badges.some((b) => b.slug === 'verified')}
        fullName={displayName}
        headline={profile.headline}
        avatarUrl={profile.avatar_url}
        city={city}
        universityName={universityName}
        editHref={isOwner ? '/profile/edit' : undefined}
      />

      <TrustSignals
        badges={badges}
        showStats={isOwner}
        profileId={isOwner ? profile.id : null}
        completionPct={wizardPct}
        badgeSlot={badgeSlot}
      />

      {displayState === 'empty' ? (
        <CompletionWizard input={wizardInput} />
      ) : null}

      {displayState === 'incomplete' ? (
        <>
          <CompletionBanner percent={wizardPct} />
          <PublicContentSection context={context} isOwner={isOwner} />
        </>
      ) : null}

      {displayState === 'complete' ? (
        <PublicContentSection context={context} isOwner={isOwner} />
      ) : null}

      {isOwner ? <OwnerActionsBar /> : null}
      {isHrViewer ? <HRActionStrip profileId={profile.id} /> : null}
      {isMentorViewer ? <RequestMentorshipButton profileId={profile.id} /> : null}
    </main>
  )
}
