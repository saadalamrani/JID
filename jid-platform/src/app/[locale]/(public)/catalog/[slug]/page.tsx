import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import {
  fetchCatalogRegionOptions,
  fetchCatalogSectorOptions,
  fetchCompanyBySlug,
  fetchViewerOwnsDirectory,
} from '@/lib/queries/catalog'
import { lookupPublishedProfileLinkByDirectoryId } from '@/lib/queries/published-profile'
import { CatalogDetailView } from '../_components/catalog-detail-view'

type CatalogDetailPageProps = {
  params: { slug: string }
}

export default async function CatalogDetailPage({ params }: CatalogDetailPageProps) {
  const company = await fetchCompanyBySlug(params.slug)
  if (!company) {
    notFound()
  }

  const [isDirectoryOwner, sectors, regions, publishedLookup] = await Promise.all([
    fetchViewerOwnsDirectory(company.id),
    fetchCatalogSectorOptions(),
    fetchCatalogRegionOptions(),
    lookupPublishedProfileLinkByDirectoryId(company.id),
  ])

  const publishedProfileHref =
    publishedLookup.kind === 'link' ? publishedLookup.target.href : null

  return (
    <main className="container-jid py-8">
      <CatalogDetailView
        company={company}
        isDirectoryOwner={isDirectoryOwner}
        sectors={sectors}
        regions={regions}
        publishedProfileHref={publishedProfileHref}
      />
    </main>
  )
}

export async function generateMetadata({ params }: CatalogDetailPageProps) {
  const t = await getTranslations('catalogPage.detail')
  const company = await fetchCompanyBySlug(params.slug)
  if (!company) {
    return { title: t('metaFallback') }
  }

  return {
    title: company.name_ar ?? company.name_en,
    description: company.hasPublishedProfile
      ? company.profile_about_ar ?? company.profile_tagline_ar ?? undefined
      : company.description_ar ?? undefined,
  }
}
