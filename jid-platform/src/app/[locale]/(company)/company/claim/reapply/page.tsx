'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { ClaimSubmissionForm } from '@/components/entity/claim-submission-form'
import { canReapplyNow, getLatestRejectedClaim, type RejectedClaimView } from '@/lib/entity/rejected-claim'
import { createClient } from '@/lib/supabase/client'
import { Link, useRouter } from '@/lib/i18n/navigation'

export default function CompanyReapplyPage() {
  const t = useTranslations('entity.reapply')
  const router = useRouter()
  const [claim, setClaim] = useState<RejectedClaimView | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
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

      const rejected = await getLatestRejectedClaim(supabase, user.id)
      if (!rejected) {
        router.replace('/company/rejected')
        return
      }

      if (!canReapplyNow(rejected.can_reapply_after)) {
        setBlocked(true)
        setClaim(rejected)
        setLoading(false)
        return
      }

      const { data: prior } = await supabase
        .from('claim_requests')
        .select('company_id')
        .eq('id', rejected.id)
        .maybeSingle()

      setCompanyId(prior?.company_id ?? null)
      setClaim(rejected)
      setLoading(false)
    }

    void load()
  }, [router])

  if (loading) return <p className="p-8 text-sm text-jid-ink/60">{t('loading')}</p>

  if (blocked && claim) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <p className="text-sm text-red-600">{t('blocked')}</p>
        <Link href="/company/rejected" className="mt-4 inline-block text-sm text-jid-olive hover:underline">
          {t('back')}
        </Link>
      </div>
    )
  }

  if (!claim || !companyId) {
    return <p className="p-8 text-sm text-red-600">{t('error')}</p>
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-semibold text-jid-ink">{t('title')}</h1>
      <p className="mt-2 text-sm text-jid-ink/70">{claim.company_name}</p>
      <div className="mt-6">
        <ClaimSubmissionForm
          companyId={companyId}
          companyName={claim.company_name}
          claimType="company"
          onSuccess={() => router.push('/company/pending-review')}
        />
      </div>
    </div>
  )
}
