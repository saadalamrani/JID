'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { ClaimSubmissionForm } from '@/components/entity/claim-submission-form'
import { OrgOutcomePanel } from '@/components/entity/org-outcome-panel'
import {
  canReapplyNow,
  getLatestRejectedVerification,
  type RejectedClaimView,
} from '@/lib/entity/rejected-claim'
import { createClient } from '@/lib/supabase/client'
import { Link, useRouter } from '@/lib/i18n/navigation'
import { formatDateTime } from '@/lib/utils/format'

/** Spec 03-B — University reapply (mirrors Business verification/reapply behavior). */
export default function UniversityVerificationReapplyPage() {
  const t = useTranslations('entity.reapply')
  const locale = useLocale()
  const router = useRouter()
  const [verification, setVerification] = useState<RejectedClaimView | null>(null)
  const [loading, setLoading] = useState(true)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const rejected = await getLatestRejectedVerification(supabase, user.id, 'university')
      if (!rejected) {
        router.replace('/university/rejected')
        return
      }

      if (!canReapplyNow(rejected.can_reapply_after)) {
        setBlocked(true)
        setVerification(rejected)
        setLoading(false)
        return
      }

      setVerification(rejected)
      setLoading(false)
    }

    void load()
  }, [router])

  if (loading) {
    return (
      <OrgOutcomePanel tone="neutral" testId="reapply-loading">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t('loading')}
        </p>
      </OrgOutcomePanel>
    )
  }

  if (blocked && verification) {
    return (
      <OrgOutcomePanel tone="blocked" testId="reapply-blocked">
        <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-3 text-sm text-destructive" role="status">
          {t('blocked')}
        </p>
        {verification.can_reapply_after ? (
          <p className="mt-2 text-sm text-muted-foreground" data-testid="reapply-cooldown-reason">
            {formatDateTime(
              verification.can_reapply_after,
              locale.startsWith('ar') ? 'ar-SA' : 'en-US',
            )}
          </p>
        ) : null}
        <Link
          href="/university/rejected"
          className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-gold/60"
        >
          {t('back')}
        </Link>
      </OrgOutcomePanel>
    )
  }

  if (!verification?.directory_id) {
    return (
      <OrgOutcomePanel tone="blocked" testId="reapply-error">
        <p className="text-sm text-destructive" role="alert">
          {t('error')}
        </p>
      </OrgOutcomePanel>
    )
  }

  return (
    <OrgOutcomePanel tone="neutral" testId="reapply-form">
      <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{verification.company_name}</p>
      <div className="mt-6" data-testid="university-reapply-form">
        <ClaimSubmissionForm
          companyId={verification.directory_id}
          companyName={verification.company_name}
          claimType="university"
          onSuccess={() => router.push('/university/pending-review')}
        />
      </div>
    </OrgOutcomePanel>
  )
}
