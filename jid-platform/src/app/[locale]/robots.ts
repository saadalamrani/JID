import type { MetadataRoute } from 'next'
import { buildRobots } from '@/lib/seo/robots-config'

/** Section 14 — locale-scoped robots metadata (re-exported at app root for /robots.txt). */
export default function robots(): MetadataRoute.Robots {
  return buildRobots()
}
