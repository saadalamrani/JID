import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { fetchVerificationReviewWorkspace } from '@/lib/staff/claim-review-queries'
import { VerificationReviewWorkspace } from './_components/verification-review-workspace'

type VerificationReviewPageProps = {
  params: Promise<{ id: string }>
}

/** P-108 — server-fetched verification review workspace with auto-assign on first view. */
export default async function VerificationReviewPage({ params }: VerificationReviewPageProps) {
  const { id } = await params
  const t = await getTranslations('staff.verificationReview')
  const workspace = await fetchVerificationReviewWorkspace(id)

  if (!workspace) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{t('notFound')}</p>
        <Link href="/staff/verification" className="text-sm text-primary hover:underline">
          {t('backToQueue')}
        </Link>
      </div>
    )
  }

  return <VerificationReviewWorkspace data={workspace} />
}
