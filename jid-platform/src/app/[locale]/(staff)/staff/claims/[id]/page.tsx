import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { fetchClaimReviewWorkspace } from '@/lib/staff/claim-review-queries'
import { ClaimReviewWorkspace } from './_components/claim-review-workspace'

type ClaimReviewPageProps = {
  params: Promise<{ id: string }>
}

/** Section 7.4 — server-fetched claim review workspace with auto-assign on first view. */
export default async function ClaimReviewPage({ params }: ClaimReviewPageProps) {
  const { id } = await params
  const t = await getTranslations('staff.claimReview')
  const workspace = await fetchClaimReviewWorkspace(id)

  if (!workspace) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{t('notFound')}</p>
        <Link href="/staff/claims" className="text-sm text-primary hover:underline">
          {t('backToQueue')}
        </Link>
      </div>
    )
  }

  return <ClaimReviewWorkspace data={workspace} />
}
