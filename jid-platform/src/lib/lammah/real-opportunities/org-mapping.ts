import type { DirectoryAnchor, OrganizationMappingStatus } from './types'
import { urlHost } from './urls'
import { normalizeMatchingText } from './normalize'

export const DIRECTORY_ANCHORS: readonly DirectoryAnchor[] = [
  {
    canonical_name_en: 'Saudi Aramco',
    canonical_name_ar: 'أرامكو السعودية',
    domains: ['aramco.com', 'aramco.sa'],
    mapping_status: 'mapped_pending_catalog_uuid',
    catalog_dependency: true,
  },
  {
    canonical_name_en: 'SABIC',
    canonical_name_ar: 'سابك',
    domains: ['sabic.com', 'sabic.sa'],
    mapping_status: 'mapped_pending_catalog_uuid',
    catalog_dependency: true,
  },
  {
    canonical_name_en: 'King Saud University',
    canonical_name_ar: 'جامعة الملك سعود',
    domains: ['ksu.edu.sa'],
    mapping_status: 'mapped_pending_catalog_uuid',
    catalog_dependency: true,
  },
  {
    canonical_name_en: 'King Abdulaziz University',
    canonical_name_ar: 'جامعة الملك عبدالعزيز',
    domains: ['kau.edu.sa'],
    mapping_status: 'mapped_pending_catalog_uuid',
    catalog_dependency: true,
  },
]

export type OrganizationMappingResult = {
  status: OrganizationMappingStatus
  method: 'official_domain' | 'none'
  catalogOrgDependency: boolean
  directoryCompanyId: null
  canonicalName: string | null
}

function hostMatchesDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`)
}

export function mapOrganization(input: {
  organizationName: string
  sourceUrl: string
  applyUrl: string
}): OrganizationMappingResult {
  const host = urlHost(input.sourceUrl) ?? urlHost(input.applyUrl)
  const normalizedName = normalizeMatchingText(input.organizationName)

  if (host) {
    const byDomain = DIRECTORY_ANCHORS.find((anchor) =>
      anchor.domains.some((domain) => hostMatchesDomain(host, domain)),
    )
    if (byDomain) {
      return {
        status: byDomain.mapping_status,
        method: 'official_domain',
        catalogOrgDependency: byDomain.catalog_dependency,
        directoryCompanyId: null,
        canonicalName: byDomain.canonical_name_en,
      }
    }
  }

  const byName = DIRECTORY_ANCHORS.find((anchor) => {
    const names = [anchor.canonical_name_en, anchor.canonical_name_ar].map(normalizeMatchingText)
    return names.includes(normalizedName)
  })
  if (byName && host && byName.domains.some((domain) => hostMatchesDomain(host, domain))) {
    return {
      status: byName.mapping_status,
      method: 'official_domain',
      catalogOrgDependency: byName.catalog_dependency,
      directoryCompanyId: null,
      canonicalName: byName.canonical_name_en,
    }
  }

  return {
    status: 'ORG_MAPPING_REQUIRED',
    method: 'none',
    catalogOrgDependency: true,
    directoryCompanyId: null,
    canonicalName: null,
  }
}
