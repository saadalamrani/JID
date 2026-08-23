import {
  canReapplyNow,
  formatRequiredDocuments,
} from '@/lib/entity/rejected-claim'
import { getLatestVerificationForUser } from '@/lib/entity/claims'
import { resolveVerificationOutcome } from '@/lib/entity/verification-outcome'
import { fetchOwnerUniversityProfileRow } from '@/lib/profile/owner-university-profile'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { RejectedVerificationPanel } from '@/components/entity/rejected-verification-panel'
import { formatDateTime } from '@/lib/utils/format'

export default async function UniversityRejectedPage() {
  const t = await getTranslations('entity.rejected')
  const locale = (await getLocale()) as 'ar' | 'en'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let profileRow: { id: string; status: string } | null = null
  let latestVerification: Awaited<ReturnType<typeof getLatestVerificationForUser>> = null
  try {
    profileRow = await fetchOwnerUniversityProfileRow(supabase, user.id)
    latestVerification = await getLatestVerificationForUser(supabase, user.id, 'university')
  } catch {
    profileRow = null
    latestVerification = null
  }

  const outcome = resolveVerificationOutcome({
    orgType: 'university',
    authenticated: true,
    profile: profileRow ? { status: profileRow.status } : null,
    verification: latestVerification
      ? {
          status: latestVerification.status,
          resulting_profile_id: latestVerification.resulting_profile_id,
        }
      : null,
  })

  if (outcome.kind !== 'rejected') {
    redirect(outcome.path)
  }

  if (!latestVerification || latestVerification.status !== 'rejected') {
    redirect('/signup/entity-type')
  }

  const canReapply = canReapplyNow(latestVerification.can_reapply_after)
  const reasonText = latestVerification.rejection_reason?.trim()
    ? latestVerification.rejection_reason
    : t('noReason')

  const cooldownText = latestVerification.can_reapply_after
    ? canReapply
      ? t('canReapplyNow')
      : t('blockedUntil', {
          date: formatDateTime(
            latestVerification.can_reapply_after,
            locale === 'ar' ? 'ar-SA' : 'en-US',
          ),
        })
    : null

  // Spec 03 route contract preserved: href="/university/reapply"
  return (
    <RejectedVerificationPanel
      title={t('title')}
      orgName={latestVerification.company_name}
      reasonLabel={t('reason')}
      reasonText={reasonText}
      documentsLabel={t('requiredDocuments')}
      documentsText={formatRequiredDocuments(
        Array.isArray(latestVerification.required_documents)
          ? latestVerification.required_documents
          : [],
        locale,
      )}
      cooldownText={cooldownText}
      canReapply={canReapply}
      reapplyHref="/university/reapply"
      reapplyCta={t('reapplyCta')}
      blockedMessage={t('blockedMessage')}
    />
  )
}
