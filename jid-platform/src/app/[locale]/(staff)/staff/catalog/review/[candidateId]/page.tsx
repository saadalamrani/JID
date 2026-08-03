import { notFound } from 'next/navigation'
import { fetchCatalogReview } from '@/lib/staff/catalog-operations'
import { CatalogReviewWorkspace } from '../_components/catalog-review-workspace'

type Props = { params: Promise<{ candidateId: string }> }
export const dynamic = 'force-dynamic'

export default async function CatalogReviewDetailPage({ params }: Props) {
  const { candidateId } = await params
  const detail = await fetchCatalogReview(candidateId)
  if (!detail) notFound()
  return <CatalogReviewWorkspace detail={detail} />
}
