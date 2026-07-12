'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { ClaimSubmissionForm } from '@/components/entity/claim-submission-form'
import {
  canReapplyNow,
  getLatestRejectedVerification,
  type RejectedClaimView,
} from '@/lib/entity/rejected-claim'
import { createClient } from '@/lib/supabase/client'
import { Link, useRouter } from '@/lib/i18n/navigation'

export default function CompanyVerificationReapplyPage() {
  const t = useTranslations('entity.reapply')
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

      const rejected = await getLatestRejectedVerification(supabase, user.id, 'business')
      if (!rejected) {
        router.replace('/company/verification-rejected')
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

  if (loading) return <p className="p-8 text-sm text-foreground/60">{t('loading')}</p>

  if (blocked && verification) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <p className="text-sm text-red-600">{t('blocked')}</p>
        <Link
          href="/company/verification-rejected"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          {t('back')}
        </Link>
      </div>
    )
  }

  if (!verification?.directory_id) {
    return <p className="p-8 text-sm text-red-600">{t('error')}</p>
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
      <p className="mt-2 text-sm text-foreground/70">{verification.company_name}</p>
      <div className="mt-6">
        <ClaimSubmissionForm
          companyId={verification.directory_id}
          companyName={verification.company_name}
          claimType="company"
          onSuccess={() => router.push('/company/verification-pending')}
        />
      </div>
    </div>
  )
}
