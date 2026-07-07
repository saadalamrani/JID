import type { MetadataRoute } from 'next'
import { buildFullSitemap } from '@/lib/seo/build-sitemap'

/** Comprehensive sitemap at `/sitemap.xml` (Arabic + English URLs). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildFullSitemap()
}

export const revalidate = 3600
