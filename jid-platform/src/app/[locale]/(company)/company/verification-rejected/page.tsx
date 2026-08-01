import {
  canReapplyNow,
  formatRequiredDocuments,
  getLatestRejectedVerification,
} from '@/lib/entity/rejected-claim'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { RejectedVerificationPanel } from '@/components/entity/rejected-verification-panel'
import { formatDateTime } from '@/lib/utils/format'

export default async function CompanyVerificationRejectedPage() {
  const t = await getTranslations('entity.rejected')
  const locale = (await getLocale()) as 'ar' | 'en'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const verification = await getLatestRejectedVerification(supabase, user.id, 'business')
  if (!verification) redirect('/signup/entity-type')

  const canReapply = canReapplyNow(verification.can_reapply_after)
  const reasonText = verification.rejection_reason?.trim()
    ? verification.rejection_reason
    : t('noReason')

  const cooldownText = verification.can_reapply_after
    ? canReapply
      ? t('canReapplyNow')
      : t('blockedUntil', {
          date: formatDateTime(verification.can_reapply_after, locale === 'ar' ? 'ar-SA' : 'en-US'),
        })
    : null

  // Spec 03 route contract preserved: href="/company/verification/reapply"
  return (
    <RejectedVerificationPanel
      title={t('title')}
      orgName={verification.company_name}
      reasonLabel={t('reason')}
      reasonText={reasonText}
      documentsLabel={t('requiredDocuments')}
      documentsText={formatRequiredDocuments(verification.required_documents, locale)}
      cooldownText={cooldownText}
      canReapply={canReapply}
      reapplyHref="/company/verification/reapply"
      reapplyCta={t('reapplyCta')}
      blockedMessage={t('blockedMessage')}
    />
  )
}
