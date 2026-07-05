'use client'

import { useTranslations } from 'next-intl'
import { ClaimReviewModal } from '@/app/[locale]/(staff)/_components/claim-review-modal'
import { useClaimDetail } from '@/hooks/use-claims-queue'
import { Link, useRouter } from '@/lib/i18n/navigation'

type ClaimReviewPageProps = {
  params: { id: string }
}

export default function ClaimReviewPage({ params }: ClaimReviewPageProps) {
  const { id } = params
  const t = useTranslations('staff.claimReview')
  const router = useRouter()
  const { data: claim, isLoading, isError } = useClaimDetail(id)

  if (isLoading) {
    return <p className="text-sm text-jid-ink/60">{t('loading')}</p>
  }

  if (isError || !claim) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">{t('notFound')}</p>
        <Link href="/staff/claims/queue" className="text-sm text-jid-olive hover:underline">
          {t('backToQueue')}
        </Link>
      </div>
    )
  }

  return (
    <ClaimReviewModal
      claim={claim}
      open
      onOpenChange={(open) => {
        if (!open) router.push('/staff/claims/queue')
      }}
    />
  )
}
